"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { callAdmin } from "@/lib/admin/client";
import { auth } from "@/lib/firebaseClient";

interface Post {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content: string;
  coverEmoji: string;
  featuredImage: string;
  published: boolean;
  updatedAt: number;
}

const EMPTY: Post = { slug: "", title: "", description: "", keywords: [], content: "", coverEmoji: "📝", featuredImage: "", published: false, updatedAt: 0 };

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

/** Compress a picked file to a web-friendly JPEG data (max 1400px wide). */
async function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality).split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadImage(file: File): Promise<string> {
  let data = await compressImage(file);
  if (data.length > 690_000) data = await compressImage(file, 1000, 0.7);
  if (data.length > 690_000) throw new Error("Image is too large even after compression.");
  const user = auth.currentUser;
  const token = await user!.getIdToken();
  const res = await fetch("/api/admin/blog-images", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data, contentType: "image/jpeg" }),
  });
  const out = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !out.url) throw new Error(out.error ?? "Upload failed.");
  return out.url;
}

/** One SEO check row. */
function Check({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span>{ok ? "✅" : warn ? "🟡" : "❌"}</span>
      <span className={ok ? "opacity-80" : ""}>{label}</span>
    </li>
  );
}

export default function AdminBlogs() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"featured" | "inline" | null>(null);
  const [err, setErr] = useState("");
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const featuredInput = useRef<HTMLInputElement>(null);
  const inlineInput = useRef<HTMLInputElement>(null);

  const load = () => callAdmin<{ posts: Post[] }>("blogs").then((d) => setPosts(d.posts)).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  // --- SEO analysis of the draft ---
  const seo = useMemo(() => {
    if (!editing) return null;
    const words = editing.content.trim() ? editing.content.trim().split(/\s+/).length : 0;
    const focus = (editing.keywords[0] ?? "").toLowerCase();
    const inTitle = !!focus && editing.title.toLowerCase().includes(focus);
    const inDesc = !!focus && editing.description.toLowerCase().includes(focus);
    const inContent = !!focus && editing.content.toLowerCase().includes(focus);
    return {
      words,
      readMins: Math.max(1, Math.round(words / 200)),
      titleOk: editing.title.length >= 30 && editing.title.length <= 60,
      descOk: editing.description.length >= 70 && editing.description.length <= 160,
      kwOk: editing.keywords.length >= 3 && editing.keywords.length <= 10,
      lengthOk: words >= 300,
      headingsOk: /^#{1,3}\s/m.test(editing.content),
      imageOk: !!editing.featuredImage || /!\[/.test(editing.content),
      slugOk: editing.slug.length > 0 && editing.slug.length <= 50,
      focus,
      focusOk: inTitle && inDesc && inContent,
      focusPartial: inTitle || inDesc || inContent,
    };
  }, [editing]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setErr("");
    try {
      await callAdmin("blogs", { method: "POST", body: editing });
      setEditing(null);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug: string) => {
    if (!confirm(`Delete "${slug}" permanently?`)) return;
    await callAdmin(`blogs?slug=${slug}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  const pickFeatured = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading("featured");
    setErr("");
    try {
      const url = await uploadImage(file);
      setEditing({ ...editing, featuredImage: url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const insertInline = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading("inline");
    setErr("");
    try {
      const url = await uploadImage(file);
      const md = `\n![Describe this image for SEO](${url})\n`;
      const ta = contentRef.current;
      const pos = ta ? ta.selectionStart : editing.content.length;
      const content = editing.content.slice(0, pos) + md + editing.content.slice(pos);
      setEditing({ ...editing, content });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  if (editing && seo) {
    const set = (p: Partial<Post>) => setEditing({ ...editing, ...p });
    const tLen = editing.title.length;
    const dLen = editing.description.length;
    const counter = (len: number, lo: number, hi: number) => (len === 0 ? "opacity-50" : len < lo || len > hi ? "text-red-600" : "text-green-600");
    return (
      <div className="flex flex-col gap-8 xl:flex-row">
        <div className="max-w-3xl flex-1 space-y-4">
          <h1 className="text-3xl font-bold">{isNew ? "New post" : `Edit: ${editing.slug}`}</h1>

          <div>
            <label className="text-sm font-medium">
              Title <span className={counter(tLen, 30, 60)}>({tLen} chars — aim for 30–60)</span>
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
              value={editing.title}
              onChange={(e) => set({ title: e.target.value, ...(isNew ? { slug: slugify(e.target.value) } : {}) })}
              placeholder="How to write a resume that gets interviews in India"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Slug (URL: /blog/…) <span className="opacity-50">— short, keyword-first</span></label>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 font-mono text-sm"
              value={editing.slug}
              disabled={!isNew}
              onChange={(e) => set({ slug: slugify(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Meta description <span className={counter(dLen, 70, 160)}>({dLen} chars — aim for 70–160)</span>
            </label>
            <textarea
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
              rows={2}
              value={editing.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="The sentence searchers see under your title in Google — sell the click."
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">
                Keywords <span className="opacity-50">(comma-separated, 3–10; the FIRST is your focus keyword)</span>
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
                value={editing.keywords.join(", ")}
                onChange={(e) => set({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                placeholder="resume tips for freshers, ATS resume, resume format india"
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium">Emoji</label>
              <input className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 text-center" value={editing.coverEmoji} onChange={(e) => set({ coverEmoji: e.target.value })} />
            </div>
          </div>

          {/* featured image */}
          <div>
            <label className="text-sm font-medium">Featured image <span className="opacity-50">(hero + Google/social share image)</span></label>
            <input ref={featuredInput} type="file" accept="image/*" className="hidden" onChange={(e) => pickFeatured(e.target.files?.[0])} />
            {editing.featuredImage ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editing.featuredImage} alt="Featured" className="h-24 w-40 rounded-xl border border-black/10 object-cover" />
                <button onClick={() => featuredInput.current?.click()} className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-neutral-50">Replace</button>
                <button onClick={() => set({ featuredImage: "" })} className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">Remove</button>
              </div>
            ) : (
              <button
                onClick={() => featuredInput.current?.click()}
                disabled={uploading === "featured"}
                className="mt-2 rounded-xl border border-dashed border-black/25 px-5 py-4 text-sm opacity-70 hover:opacity-100"
              >
                {uploading === "featured" ? "Uploading…" : "＋ Upload featured image"}
              </button>
            )}
          </div>

          {/* content */}
          <div>
            <div className="flex items-end justify-between">
              <label className="text-sm font-medium">
                Content <span className="opacity-50">(markdown: # headings, **bold**, - lists, [links](https://…))</span>
              </label>
              <button
                onClick={() => inlineInput.current?.click()}
                disabled={uploading === "inline"}
                className="rounded-lg border border-black/15 px-3 py-1 text-sm hover:bg-neutral-50"
              >
                {uploading === "inline" ? "Uploading…" : "🖼 Insert image at cursor"}
              </button>
              <input ref={inlineInput} type="file" accept="image/*" className="hidden" onChange={(e) => insertInline(e.target.files?.[0])} />
            </div>
            <textarea
              ref={contentRef}
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 font-mono text-sm"
              rows={18}
              value={editing.content}
              onChange={(e) => set({ content: e.target.value })}
            />
            <p className="mt-1 text-xs opacity-50">
              {seo.words} words · ~{seo.readMins} min read. After inserting an image, edit its alt text (the part in [brackets]) — it matters for SEO.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={editing.published} onChange={(e) => set({ published: e.target.checked })} />
            Published (live at /blog/{editing.slug || "…"} + in the sitemap)
          </label>
          {err ? <p className="text-red-600">{err}</p> : null}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save post"}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-black/15 px-5 py-2.5 hover:bg-neutral-50">Cancel</button>
          </div>
        </div>

        {/* SEO panel */}
        <aside className="w-full shrink-0 space-y-6 xl:w-96">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="font-semibold">Google preview</h2>
            <div className="mt-3 rounded-xl border border-black/10 p-4">
              <p className="text-xs text-green-700">privatesectorjob.vercel.app › blog › {editing.slug || "your-slug"}</p>
              <p className="mt-1 truncate text-lg leading-snug text-blue-700">
                {editing.title || "Your post title appears here"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                {editing.description || "Your meta description appears here — this is what convinces a searcher to click."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <h2 className="font-semibold">SEO checklist</h2>
            <ul className="mt-3 space-y-2">
              <Check ok={seo.titleOk} label={`Title 30–60 characters (${tLen})`} />
              <Check ok={seo.descOk} label={`Meta description 70–160 characters (${dLen})`} />
              <Check ok={seo.kwOk} label={`3–10 keywords (${editing.keywords.length})`} />
              <Check
                ok={seo.focusOk}
                warn={seo.focusPartial}
                label={seo.focus ? `Focus keyword "${seo.focus}" in title, description AND content` : "Set a focus keyword (first in the list)"}
              />
              <Check ok={seo.lengthOk} label={`At least 300 words (${seo.words})`} />
              <Check ok={seo.headingsOk} label="Uses # section headings (H2/H3 structure)" />
              <Check ok={seo.imageOk} label="Has a featured or inline image" />
              <Check ok={seo.slugOk} label="Slug set and under 50 characters" />
            </ul>
            <p className="mt-4 text-xs opacity-60">
              Handled automatically: canonical URL, OpenGraph + Twitter cards (featured image becomes og:image), Article JSON-LD, sitemap entry, lazy-loaded images.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog posts</h1>
          <p className="mt-1 opacity-60">SEO-optimised articles served at /blog.</p>
        </div>
        <button
          onClick={() => {
            setIsNew(true);
            setEditing({ ...EMPTY });
          }}
          className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700"
        >
          + New post
        </button>
      </div>
      {err ? <p className="mt-6 text-red-600">{err}</p> : null}
      <div className="mt-8 space-y-3">
        {posts.length === 0 && !err ? <p className="opacity-60">No posts yet — write your first article.</p> : null}
        {posts.map((p) => (
          <div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white p-4">
            {p.featuredImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.featuredImage} alt="" className="h-12 w-20 rounded-lg border border-black/10 object-cover" />
            ) : (
              <span className="text-2xl">{p.coverEmoji}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.title}</p>
              <p className="truncate text-sm opacity-60">/blog/{p.slug}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.published ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>
              {p.published ? "published" : "draft"}
            </span>
            {p.published ? (
              <a href={`/blog/${p.slug}`} target="_blank" className="text-sm text-violet-600 hover:underline">View</a>
            ) : null}
            <button
              onClick={() => {
                setIsNew(false);
                setEditing({ ...EMPTY, ...p });
              }}
              className="rounded-lg border border-black/15 px-3 py-1 text-sm hover:bg-neutral-50"
            >
              Edit
            </button>
            <button onClick={() => remove(p.slug)} className="rounded-lg px-3 py-1 text-sm text-red-600 hover:bg-red-50">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
