import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";
import { publishedPosts } from "@/lib/blog";

/**
 * Marketing pages + published blog posts. Individual profiles can't be
 * enumerated here (security rules intentionally forbid listing publicProfiles),
 * and most are noindex anyway — discoverable profiles get indexed via their own
 * links + per-page metadata.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await publishedPosts().catch(() => []);
  return [
    { url: SITE_ORIGIN, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/resume-maker`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/job-seekers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/recruiters`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/ai-tools`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/resources`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_ORIGIN}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_ORIGIN}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_ORIGIN}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_ORIGIN}/data-deletion`, changeFrequency: "yearly", priority: 0.3 },
    ...posts.map((p) => ({
      url: `${SITE_ORIGIN}/blog/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
