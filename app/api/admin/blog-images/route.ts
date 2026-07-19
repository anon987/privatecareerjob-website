import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Blog image uploads (Storage isn't enabled on this project): the admin client
 * compresses to JPEG and posts base64; each image is its own Firestore doc
 * (≤ ~700KB base64 keeps us safely under the 1MB doc limit) served publicly
 * via /api/blog-image/[id].
 */
export async function POST(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const { data, contentType } = (await req.json().catch(() => ({}))) as { data?: string; contentType?: string };
  if (!data || typeof data !== "string") return Response.json({ error: "No image data." }, { status: 400 });
  if (data.length > 700_000) {
    return Response.json({ error: "Image too large after compression — use a smaller image." }, { status: 400 });
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(data)) return Response.json({ error: "Invalid image data." }, { status: 400 });
  const ct = contentType === "image/png" ? "image/png" : "image/jpeg";
  const ref = await adminDb().collection("blogImages").add({ data, contentType: ct, createdAt: FieldValue.serverTimestamp() });
  return Response.json({ ok: true, id: ref.id, url: `/api/blog-image/${ref.id}` });
}
