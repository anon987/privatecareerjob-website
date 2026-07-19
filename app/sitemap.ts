import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Static pages only. Individual profiles can't be enumerated here (security rules
 * intentionally forbid listing publicProfiles), and most are noindex anyway —
 * discoverable profiles get indexed via their own links + per-page metadata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_ORIGIN, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/resume-maker`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/job-seekers`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/recruiters`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/ai-tools`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/signup`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/resources`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_ORIGIN}/contact`, changeFrequency: "yearly", priority: 0.4 },
  ];
}
