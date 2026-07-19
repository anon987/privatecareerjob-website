"use client";

import { useEffect, useState } from "react";
import { callAdmin } from "@/lib/admin/client";

interface Post {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  content: string;
  coverEmoji: string;
  published: boolean;
  updatedAt: number;
}

const EMPTY: Post = { slug: "", title: "", description: "", keywords: [], content: "", coverEmoji: "📝", published: false, updatedAt: 0 };

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export default function AdminBlogs() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = () => callAdmin<{ posts: Post[] }>("blogs").then((d) => setPosts(d.posts)).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

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

  if (editing) {
    const set = (p: Partial<Post>) => setEditing({ ...editing, ...p });
    const titleLen = editing.title.length;
    const descLen = editing.description.length;
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold">{isNew ? "New post" : `Edit: ${editing.slug}`}</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Title <span className={titleLen > 60 ? "text-red-600" : "opacity-50"}>({titleLen}/60 for SEO)</span></label>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
              value={editing.title}
              onChange={(e) => set({ title: e.target.value, ...(isNew ? { slug: slugify(e.target.value) } : {}) })}
              placeholder="How to write a resume that gets interviews in India"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug (URL: /blog/…)</label>
            <input
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 font-mono text-sm"
              value={editing.slug}
              disabled={!isNew}
              onChange={(e) => set({ slug: slugify(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Meta description <span className={descLen > 160 ? "text-red-600" : "opacity-50"}>({descLen}/160 for SEO)</span></label>
            <textarea
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
              rows={2}
              value={editing.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="One or two sentences shown in Google results and social shares."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Keywords (comma-separated)</label>
              <input
                className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5"
                value={editing.keywords.join(", ")}
                onChange={(e) => set({ keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })}
                placeholder="resume tips, fresher jobs, ATS resume"
              />
            </div>
            <div className="w-28">
              <label className="text-sm font-medium">Emoji</label>
              <input className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 text-center" value={editing.coverEmoji} onChange={(e) => set({ coverEmoji: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Content (markdown: # headings, **bold**, - lists, [links](https://…))</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-black/15 px-4 py-2.5 font-mono text-sm"
              rows={18}
              value={editing.content}
              onChange={(e) => set({ content: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={editing.published} onChange={(e) => set({ published: e.target.checked })} />
            Published (visible at /blog/{editing.slug || "…"} and in the sitemap)
          </label>
          {err ? <p className="text-red-600">{err}</p> : null}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Saving…" : "Save post"}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-xl border border-black/15 px-5 py-2.5 hover:bg-neutral-50">Cancel</button>
          </div>
        </div>
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
            <span className="text-2xl">{p.coverEmoji}</span>
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
