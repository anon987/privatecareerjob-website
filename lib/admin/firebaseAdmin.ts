import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Admin-SDK Firestore access for the admin panel. Prefers
 * FIREBASE_SERVICE_ACCOUNT_KEY (the firebase-adminsdk key generated from the
 * Firebase console — it always has Firestore access), then falls back to the
 * Vertex key (GOOGLE_SERVICE_ACCOUNT_KEY), then ADC. Named app so it can carry
 * credentials without clashing with the token-verify app in lib/ai/serverAuth
 * (which is credential-less on purpose).
 */

const PROJECT_ID = "privatesectorjob";
const APP_NAME = "admin-data";

function adminApp(): App {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    const key = JSON.parse(raw) as { client_email: string; private_key: string };
    return initializeApp(
      {
        projectId: PROJECT_ID,
        credential: cert({
          projectId: PROJECT_ID,
          clientEmail: key.client_email,
          privateKey: key.private_key.replace(/\\n/g, "\n"),
        }),
      },
      APP_NAME
    );
  }
  return initializeApp({ projectId: PROJECT_ID }, APP_NAME);
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
