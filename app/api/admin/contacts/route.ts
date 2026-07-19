import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";

/** Contact inbox: list messages; PATCH flips status (new → read → resolved). */
export async function GET(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  try {
    const snap = await adminDb().collection("contactMessages").orderBy("createdAt", "desc").limit(200).get();
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.get("createdAt")?.toMillis?.() ?? 0 }));
    return Response.json({ messages });
  } catch (e) {
    console.error("[admin/contacts]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Could not load messages." }, { status: 502 });
  }
}

export async function PATCH(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !["new", "read", "resolved"].includes(status ?? "")) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  await adminDb().collection("contactMessages").doc(id).update({ status });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Invalid request." }, { status: 400 });
  await adminDb().collection("contactMessages").doc(id).delete();
  return Response.json({ ok: true });
}
