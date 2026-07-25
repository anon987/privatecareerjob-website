import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Verifies the Firebase ID token sent by the dashboard. Token verification
 * only needs the public project id (Google's public certs do the rest), so
 * this works before any GCP service-account setup.
 */

const PROJECT_ID = "private-career-job-e46ec";

function adminAuth() {
  const app = getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
  return getAuth(app);
}

/** Returns the caller's uid, or null when the token is missing/invalid. */
export async function verifyRequest(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}
