// D:/Accountiblity partner/src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  unlockApp: () => ipcRenderer.send("unlock-app")
});
