import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Blog CMS: blogPosts/{slug}. SEO fields are first-class — title,
 * description, keywords — and the public pages build metadata from them.
 */

interface BlogInput {
  slug?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  content?: string;
  coverEmoji?: string;
  published?: boolean;
}

export async function GET(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const snap = await adminDb().collection("blogPosts").orderBy("updatedAt", "desc").limit(200).get();
  const posts = snap.docs.map((d) => ({
    slug: d.id,
    ...d.data(),
    createdAt: d.get("createdAt")?.toMillis?.() ?? 0,
    updatedAt: d.get("updatedAt")?.toMillis?.() ?? 0,
  }));
  return Response.json({ posts });
}

export async function POST(req: Request): Promise<Response> {
  const admin = await verifyAdmin(req);
  if (!admin) return NOT_ADMIN;
  const body = (await req.json().catch(() => ({}))) as BlogInput;
  const slug = (body.slug ?? "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(slug)) {
    return Response.json({ error: "Slug must be lowercase letters, numbers and hyphens." }, { status: 400 });
  }
  if (!body.title?.trim() || !body.content?.trim()) {
    return Response.json({ error: "Title and content are required." }, { status: 400 });
  }
  const ref = adminDb().collection("blogPosts").doc(slug);
  const existing = await ref.get();
  await ref.set(
    {
      title: body.title.trim().slice(0, 140),
      description: (body.description ?? "").trim().slice(0, 300),
      keywords: (body.keywords ?? []).map((k) => String(k).trim()).filter(Boolean).slice(0, 15),
      content: String(body.content).slice(0, 200_000),
      coverEmoji: (body.coverEmoji ?? "📝").slice(0, 8),
      published: !!body.published,
      author: admin.email,
      updatedAt: FieldValue.serverTimestamp(),
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );
  return Response.json({ ok: true, slug });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return Response.json({ error: "Invalid request." }, { status: 400 });
  await adminDb().collection("blogPosts").doc(slug).delete();
  return Response.json({ ok: true });
}
