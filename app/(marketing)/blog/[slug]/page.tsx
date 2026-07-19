import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, renderMarkdown } from "@/lib/blog";
import { SITE_ORIGIN } from "@/lib/site";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      publishedTime: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
      modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    keywords: post.keywords.join(", "),
    datePublished: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
    author: { "@type": "Organization", name: "privatesectorjob", url: SITE_ORIGIN },
    publisher: { "@type": "Organization", name: "privatesectorjob", url: SITE_ORIGIN },
    mainEntityOfPage: `${SITE_ORIGIN}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="text-sm text-violet-600 hover:underline">
        ← All articles
      </Link>
      <div className="mt-6 text-5xl">{post.coverEmoji}</div>
      <h1 className="mt-4 text-4xl font-bold leading-tight">{post.title}</h1>
      <p className="mt-3 text-lg opacity-75">{post.description}</p>
      <p className="mt-3 text-sm opacity-50">
        {post.createdAt ? new Date(post.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" }) : ""}
      </p>
      <div
        className="prose-psj mt-10 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-violet-600 [&_a]:underline [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
      <div className="mt-14 rounded-2xl border border-violet-200 bg-violet-50 p-6">
        <p className="font-semibold">Ready to put this into practice?</p>
        <p className="mt-1 text-sm opacity-75">
          Build a free ATS-friendly resume and find verified private-sector jobs on privatesectorjob.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700"
        >
          Get started free
        </Link>
      </div>
    </article>
  );
}
