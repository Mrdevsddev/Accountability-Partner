// D:/Accountiblity partner/shared/firebase-admin.ts
import * as admin from "firebase-admin";

export function getAdminApp(): admin.app.App {
  const existingApp = admin.apps.find((app) => app?.name === "[DEFAULT]");
  if (existingApp) {
    return existingApp;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, falling back to applicationDefault.", error);
    }
  }

  // Fallback to Application Default Credentials or environment variables
  return admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

export const adminApp: admin.app.App = getAdminApp();
export const adminDb: admin.firestore.Firestore = admin.firestore(adminApp);
export const adminAuth: admin.auth.Auth = admin.auth(adminApp);
