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
    { url: `${SITE_ORIGIN}/signup`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
