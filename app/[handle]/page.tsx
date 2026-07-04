import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bumpViews, fetchSite, yearsOfExperience, SITE_ORIGIN, type PublicSite } from "@/lib/site";
import { Portfolio } from "@/components/portfolio/Portfolio";

/**
 * Public portfolio pages — privatesectorjob.com/@handle.
 * Server-rendered from Firestore's public REST endpoint (revalidated every 60s),
 * so shared links get real titles/descriptions/OG cards. Pages are noindex unless
 * the owner opted into search visibility (`discoverable`).
 */

export const dynamic = "force-dynamic";

function parseHandle(segment: string): string | null {
  const decoded = decodeURIComponent(segment);
  if (!decoded.startsWith("@")) return null;
  return decoded.slice(1).toLowerCase();
}

function seoTitle(site: PublicSite): string {
  return [site.name || "@" + site.handle, site.headline, "Portfolio"].filter(Boolean).join(" | ");
}

function seoDescription(site: PublicSite): string {
  if (site.summary) return site.summary.length > 158 ? site.summary.slice(0, 155).trimEnd() + "…" : site.summary;
  const bits = [site.headline, site.location, site.skills?.slice(0, 4).join(", ")].filter(Boolean);
  return bits.length ? `${site.name} — ${bits.join(" · ")}. Portfolio on privatesectorjob.` : `${site.name}'s portfolio on privatesectorjob.`;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const handle = parseHandle((await params).handle);
  if (!handle) return { title: "Page not found — privatesectorjob" };
  const site = await fetchSite(handle);
  if (!site) return { title: "Page not found — privatesectorjob", robots: { index: false, follow: false } };

  const url = `${SITE_ORIGIN}/@${handle}`;
  const title = seoTitle(site);
  const description = seoDescription(site);
  const indexable = site.discoverable === true;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "profile",
      url,
      siteName: "privatesectorjob",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/** schema.org Person — rich-result structured data for discoverable profiles. */
function personJsonLd(site: PublicSite, url: string) {
  const years = yearsOfExperience(site);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url,
    jobTitle: site.headline || undefined,
    address: site.location ? { "@type": "PostalAddress", addressLocality: site.location } : undefined,
    email: site.email ? `mailto:${site.email}` : undefined,
    telephone: site.phone || undefined,
    knowsAbout: site.skills?.length ? site.skills : undefined,
    knowsLanguage: site.languages?.length ? site.languages.map((l) => l.replace(/ \(.*\)$/, "")) : undefined,
    alumniOf: site.education?.[0]?.school || undefined,
    worksFor: site.experience?.[0]?.company ? { "@type": "Organization", name: site.experience[0].company } : undefined,
    description: site.summary || undefined,
    ...(years ? { hasOccupation: { "@type": "Occupation", name: site.headline || "Professional" } } : {}),
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = parseHandle((await params).handle);
  if (!handle) notFound();

  const site = await fetchSite(handle);
  if (!site) {
    return (
      <div className="min-h-screen grid place-items-center text-center px-6">
        <div>
          <h1 className="text-[44px] font-extrabold tracking-[-1px]">@{handle}</h1>
          <p className="text-ink-2 mt-2.5">This page doesn&apos;t exist (yet). It could be yours.</p>
          <Link href="/signup" className="mt-6 inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition-colors">
            Claim your handle
          </Link>
        </div>
      </div>
    );
  }

  // analytics: count this render (fire-and-forget; page is force-dynamic)
  bumpViews(handle!);

  const url = `${SITE_ORIGIN}/@${handle}`;

  return (
    <>
      {site.discoverable === true && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(site, url)) }} />
      )}
      <Portfolio initial={site} />
    </>
  );
}
