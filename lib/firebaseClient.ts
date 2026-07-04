import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase web config for project `privatesectorjob` — same backend as the mobile app.
 * The apiKey is a public client identifier, not a secret; access is guarded by
 * Firestore security rules.
 */
const firebaseConfig = {
  apiKey: "AIzaSyB75zshjrs64bVAuLDxg-U9uoXMenxOlaQ",
  authDomain: "privatesectorjob.firebaseapp.com",
  projectId: "privatesectorjob",
  storageBucket: "privatesectorjob.firebasestorage.app",
  messagingSenderId: "410279228662",
  appId: "1:410279228662:web:04f178fe5462c614e168d7",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
