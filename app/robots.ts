import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Profile pages are governed per-page by their robots meta tag (noindex unless the
 * owner opted into search visibility), so crawling stays allowed here — a blanket
 * Disallow would stop crawlers from ever SEEING the noindex directives.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
