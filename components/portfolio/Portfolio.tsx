"use client";

import { useState } from "react";
import type { PublicSite } from "@/lib/site";
import { resolveTheme, tintOf } from "@/lib/themes";
import { Hero } from "./Hero";
import { Customize } from "./Customize";
import {
  Stats,
  Summary,
  Skills,
  Timeline,
  Projects,
  Achievements,
  Education,
  Certificates,
  Languages,
  Testimonials,
  Products,
  Gallery,
  Contact,
  Footer,
  StickyBar,
} from "./sections";

/**
 * The full themed portfolio page. A client component so the owner's Customize
 * panel can restyle it live; it still server-renders to HTML for SEO/social bots.
 */
export function Portfolio({ initial }: { initial: PublicSite }) {
  const [site, setSite] = useState<PublicSite>(initial);
  const t = resolveTheme(site);

  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.fontFamily).replace(/%20/g, "+")}:wght@400;600;700;800&display=swap`;
  const vars = {
    "--pa": t.accent,
    "--pa-soft": tintOf(t.accent, t.dark ? 0.16 : 0.1),
    "--pa-line": tintOf(t.accent, 0.4),
  } as React.CSSProperties;

  const gallery = <Gallery key="gal" site={site} t={t} />;
  const projects = <Projects key="prj" site={site} t={t} />;
  const middle = t.design.galleryFirst
    ? [gallery, <Skills key="sk" site={site} t={t} />, <Timeline key="tl" site={site} t={t} />, projects]
    : t.design.projectsFirst
    ? [projects, <Skills key="sk" site={site} t={t} />, <Timeline key="tl" site={site} t={t} />, gallery]
    : [<Skills key="sk" site={site} t={t} />, <Timeline key="tl" site={site} t={t} />, projects, gallery];

  return (
    <div className={`min-h-screen ${t.page}`} style={{ ...vars, fontFamily: `'${t.fontFamily}', ui-sans-serif, system-ui, sans-serif` }}>
      {/* the chosen Google Font, loaded only on this page; React hoists the link */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={fontHref} precedence="default" />

      <Hero site={site} t={t} />

      <main className="max-w-[820px] mx-auto px-5 pb-28 sm:pb-16 rise-1">
        <Stats site={site} t={t} />
        <Summary site={site} t={t} />
        {middle}
        <Achievements site={site} t={t} />
        <Education site={site} t={t} />
        <Certificates site={site} t={t} />
        <Languages site={site} t={t} />
        <Testimonials site={site} t={t} />
        <Products site={site} t={t} />
        <Contact site={site} t={t} />
        <Footer site={site} t={t} />
      </main>

      <StickyBar site={site} t={t} />
      <Customize site={site} onChange={setSite} />
    </div>
  );
}
