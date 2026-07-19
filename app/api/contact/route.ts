import { adminDb } from "@/lib/admin/firebaseAdmin";
import { rateLimit } from "@/lib/ai/rateLimit";
import { FieldValue } from "firebase-admin/firestore";

/** Public contact form → contactMessages (handled in the admin panel). */
export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 3_600_000)) {
    return Response.json({ error: "Too many messages — please try again later." }, { status: 429 });
  }
  const b = (await req.json().catch(() => ({}))) as { name?: string; email?: string; topic?: string; message?: string };
  const name = (b.name ?? "").trim().slice(0, 100);
  const email = (b.email ?? "").trim().slice(0, 200);
  const message = (b.message ?? "").trim().slice(0, 5000);
  if (!name || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: "Please fill in your name, a valid email, and a message." }, { status: 400 });
  }
  await adminDb().collection("contactMessages").add({
    name,
    email,
    topic: (b.topic ?? "General").slice(0, 60),
    message,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  });
  return Response.json({ ok: true });
}
