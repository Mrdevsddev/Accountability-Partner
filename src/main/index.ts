// D:/Accountiblity partner/src/main/index.ts
import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import dotenv from "dotenv";
import { setTaskManagerDisabled, setAutoStart } from "./registry";
import { db, auth } from "../../shared/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

let blockWindow: BrowserWindow | null = null;
let checkinTimeLocal = "22:00"; // Default check-in time fallback
let userUid: string | null = null;
let isBlockTriggered = false;
let unlockedToday = false;
let checkInterval: NodeJS.Timeout | null = null;

// Write auto-start on startup
setAutoStart(true).catch((err) => {
  console.error("Failed to configure auto-start in registry:", err);
});

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createBlockWindow() {
  if (blockWindow) return;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  blockWindow = new BrowserWindow({
    width,
    height,
    fullscreen: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    kiosk: true,
    frame: false,
    resizable: false,
    movable: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  blockWindow.setAlwaysOnTop(true, "screen-saver");
  blockWindow.setVisibleOnAllWorkspaces(true);

  blockWindow.on("close", (e) => {
    e.preventDefault();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    blockWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    blockWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  isBlockTriggered = true;
  setTaskManagerDisabled(true).catch((err) => {
    console.error("Failed to disable Task Manager in registry:", err);
  });
}

function unlockApp() {
  if (!blockWindow) return;

  blockWindow.removeAllListeners("close");
  blockWindow.close();
  blockWindow = null;
  isBlockTriggered = false;
  unlockedToday = true;

  setTaskManagerDisabled(false).catch((err) => {
    console.error("Failed to enable Task Manager in registry:", err);
  });
}

async function checkTimeAndStatus() {
  const now = new Date();
  const todayStr = getTodayString();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // If already unlocked today, do not block
  if (unlockedToday) {
    return;
  }

  // Check if check-in time has passed
  if (currentTimeStr >= checkinTimeLocal) {
    // Verify Firestore status if online/auth is available
    if (userUid) {
      try {
        const checkinDocRef = doc(db, "checkins", userUid, "checkins", todayStr);
        const checkinSnap = await getDoc(checkinDocRef);
        if (checkinSnap.exists()) {
          const data = checkinSnap.data();
          if (data && data.unlockedAt) {
            unlockedToday = true;
            return;
          }
        }
      } catch (error) {
        console.error("Error reading check-in status from Firestore:", error);
      }
    }

    // Trigger the block window
    if (!isBlockTriggered) {
      console.log(`Triggering screen block. Current time (${currentTimeStr}) >= Check-in time (${checkinTimeLocal}).`);
      createBlockWindow();
    }
  } else {
    // If before check-in time, make sure block window is not open
    if (isBlockTriggered) {
      unlockApp();
    }
    // Reset unlock state if we are in a new day before the curfew time
    unlockedToday = false;
  }
}

function startScheduler() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  checkInterval = setInterval(checkTimeAndStatus, 10000);
  checkTimeAndStatus();
}

function setupSimulationMode() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 2);
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  checkinTimeLocal = `${hours}:${minutes}`;
  console.log(`Simulation Mode Active: Screen will lock at ${checkinTimeLocal} (2 minutes from now).`);

  startScheduler();
}

async function initializeFirebaseAndBlocker() {
  const email = process.env.CURFEW_USER_EMAIL;
  const password = process.env.CURFEW_USER_PASSWORD;

  if (!email || !password) {
    console.warn("No CURFEW_USER_EMAIL or CURFEW_USER_PASSWORD environment variables found. Running in SIMULATION dev mode.");
    setupSimulationMode();
    return;
  }

  try {
    console.log(`Attempting login for user: ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    userUid = userCredential.user.uid;
    console.log(`Successfully authenticated user with UID: ${userUid}`);

    // Real-time settings listener
    const settingsRef = doc(db, "settings", userUid);
    onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.checkinTimeLocal) {
          checkinTimeLocal = data.checkinTimeLocal;
          console.log(`Check-in time updated from Firestore: ${checkinTimeLocal}`);
        }
      }
    });

    // Real-time checkin listener for today
    const todayStr = getTodayString();
    const checkinRef = doc(db, "checkins", userUid, "checkins", todayStr);
    onSnapshot(checkinRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.unlockedAt) {
          console.log("Check-in marked as unlocked in Firestore.");
          if (isBlockTriggered) {
            unlockApp();
          }
          unlockedToday = true;
        }
      }
    });

    startScheduler();
  } catch (error) {
    console.error("Firebase authentication failed. Running in SIMULATION dev mode.", error);
    setupSimulationMode();
  }
}

app.whenReady().then(() => {
  initializeFirebaseAndBlocker();

  ipcMain.on("unlock-app", async () => {
    console.log("Unlock requested by renderer process.");
    
    if (userUid) {
      try {
        const todayStr = getTodayString();
        const checkinDocRef = doc(db, "checkins", userUid, "checkins", todayStr);
        await setDoc(checkinDocRef, {
          reviewedYesterday: true,
          plannedTomorrow: true,
          snoozesUsed: 0,
          unlockedAt: new Date(),
          createdAt: new Date()
        }, { merge: true });
        console.log("Check-in unlock status saved to Firestore.");
      } catch (error) {
        console.error("Failed to write unlock status to Firestore:", error);
      }
    }
    
    unlockApp();
  });
});

app.on("window-all-closed", () => {
  // Do not quit the app, let it run in the background checking time
});
