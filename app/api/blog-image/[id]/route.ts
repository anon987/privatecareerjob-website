import { adminDb } from "@/lib/admin/firebaseAdmin";

/** Public, long-cached blog image (stored base64 in Firestore; Storage is off). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9]{5,40}$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const doc = await adminDb().collection("blogImages").doc(id).get();
    const data = doc.get("data") as string | undefined;
    if (!doc.exists || !data) return new Response("Not found", { status: 404 });
    return new Response(Buffer.from(data, "base64"), {
      headers: {
        "Content-Type": (doc.get("contentType") as string) || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
