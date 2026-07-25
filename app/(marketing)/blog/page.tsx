import type { Metadata } from "next";
import Link from "next/link";
import { publishedPosts } from "@/lib/blog";

export const revalidate = 300; // pick up new posts within 5 minutes

export const metadata: Metadata = {
  title: "Career Blog",
  description:
    "Career advice for India's private-sector job seekers: resumes, interviews, salaries, avoiding job scams, and getting hired faster.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = await publishedPosts();
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">Blog</p>
      <h1 className="mt-2 text-4xl font-bold">Career advice that gets you hired</h1>
      <p className="mt-3 text-lg opacity-75">
        Practical guides on resumes, interviews, salaries and job-scam safety — from the privatecareerjob team.
      </p>
      {posts.length === 0 ? (
        <p className="mt-12 opacity-60">No articles yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="rounded-2xl border border-black/10 p-6 transition hover:border-violet-400 hover:shadow-md"
            >
              {p.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.featuredImage} alt="" className="aspect-video w-full rounded-xl border border-black/5 object-cover" />
              ) : (
                <div className="text-3xl">{p.coverEmoji}</div>
              )}
              <h2 className="mt-3 text-xl font-semibold">{p.title}</h2>
              <p className="mt-2 text-sm opacity-70 line-clamp-3">{p.description}</p>
              <p className="mt-3 text-xs opacity-50">
                {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
