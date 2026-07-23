import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Admin gate for /api/admin/*: verifies the Firebase ID token AND that the
 * signed-in email is on the admin allowlist (ADMIN_EMAILS env, comma-separated;
 * defaults to the site owner).
 */

const PROJECT_ID = "privatesectorjob-807b8";

function allowedEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "mailtousainews@gmail.com";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

export interface AdminIdentity {
  uid: string;
  email: string;
}

/** Returns the admin's identity, or null when not signed in / not an admin. */
export async function verifyAdmin(req: Request): Promise<AdminIdentity | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const app = getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp({ projectId: PROJECT_ID });
    const decoded = await getAuth(app).verifyIdToken(token);
    const email = (decoded.email ?? "").toLowerCase();
    if (!email || !allowedEmails().has(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}

export const NOT_ADMIN = Response.json({ error: "Admin access only." }, { status: 403 });
