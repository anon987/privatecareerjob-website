import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase web config for project `privatecareerjob` — same backend as the mobile app.
 * The apiKey is a public client identifier, not a secret; access is guarded by
 * Firestore security rules.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBlrRUYhG-vE9ymyPAp9t0oai-yGzxxfg4",
  authDomain: "private-career-job-e46ec.firebaseapp.com",
  projectId: "private-career-job-e46ec",
  storageBucket: "private-career-job-e46ec.firebasestorage.app",
  messagingSenderId: "804931754380",
  appId: "1:804931754380:web:2ed07f34e43e034c7d9ea9",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
