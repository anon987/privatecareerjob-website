import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase web config for project `privatesectorjob` — same backend as the mobile app.
 * The apiKey is a public client identifier, not a secret; access is guarded by
 * Firestore security rules.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCjzZHSMOMxruppO4WplEN_bTomvoTEFKI",
  authDomain: "privatesectorjob-807b8.firebaseapp.com",
  projectId: "privatesectorjob-807b8",
  storageBucket: "privatesectorjob-807b8.firebasestorage.app",
  messagingSenderId: "1035722691373",
  appId: "1:1035722691373:web:efe7a10aa62205b1a9b9a4",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
