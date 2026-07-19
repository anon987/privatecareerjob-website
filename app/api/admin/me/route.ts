import { verifyAdmin } from "@/lib/admin/adminGuard";

/** Lightweight admin check — token + allowlist only, no Firestore involved. */
export async function GET(req: Request): Promise<Response> {
  const admin = await verifyAdmin(req);
  if (!admin) return Response.json({ error: "This account is not on the admin allowlist." }, { status: 403 });
  return Response.json({ ok: true, email: admin.email });
}
