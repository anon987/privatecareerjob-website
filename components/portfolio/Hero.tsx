"use client";

import { useState } from "react";
import type { PublicSite } from "@/lib/site";
import { safeImg } from "@/lib/site";
import { tintOf, type ResolvedTheme } from "@/lib/themes";

function initialsOf(name: string, handle: string) {
  return (name || handle)
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function pageUrl(handle: string) {
  return `https://privatecareerjob.com/@${handle}`;
}

/** Primary + secondary CTAs and quick actions. `onLight` = rendered on accent/dark hero. */
export function HeroActions({ site, onLight }: { site: PublicSite; onLight?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = pageUrl(site.handle);

  const share = async () => {
    const text = `${site.name} — ${site.headline}. ${url}`;
    if (navigator.share) {
      await navigator.share({ title: site.name, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const solid = onLight
    ? "bg-white text-[var(--pa)] hover:bg-white/90"
    : "bg-[var(--pa)] text-white hover:opacity-90";
  const outline = onLight
    ? "border border-white/60 text-white hover:bg-white/10"
    : "border border-[var(--pa-line)] text-[var(--pa)] hover:bg-[var(--pa-soft)]";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
      {site.email ? (
        <a href={`mailto:${site.email}?subject=Opportunity via privatecareerjob`} className={`inline-flex items-center min-h-11 px-6 rounded-full text-[14.5px] font-bold transition-colors ${solid}`}>
          Hire me
        </a>
      ) : (
        <a href="#contact" className={`inline-flex items-center min-h-11 px-6 rounded-full text-[14.5px] font-bold transition-colors ${solid}`}>
          Get in touch
        </a>
      )}
      {site.resumeUrl && (
        <a href={site.resumeUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center min-h-11 px-6 rounded-full text-[14.5px] font-bold transition-colors ${outline}`}>
          Resume
        </a>
      )}
      {site.phone && (
        <a href={`tel:${site.phone}`} aria-label="Call" className={`inline-flex items-center min-h-11 px-5 rounded-full text-[14.5px] font-bold transition-colors ${outline}`}>
          Call
        </a>
      )}
      <button onClick={share} aria-label="Share profile" className={`inline-flex items-center min-h-11 px-5 rounded-full text-[14.5px] font-bold transition-colors cursor-pointer ${outline}`}>
        Share
      </button>
      <button onClick={copy} aria-label="Copy link" className={`inline-flex items-center min-h-11 px-5 rounded-full text-[14.5px] font-bold transition-colors cursor-pointer ${outline}`}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

function Avatar({ site, size, ring }: { site: PublicSite; size: number; ring: string }) {
  const photo = safeImg(site.photoUri);
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={site.name || site.handle} width={size} height={size} className={`rounded-full object-cover border-4 ${ring}`} style={{ width: size, height: size }} />;
  }
  return (
    <div className={`rounded-full grid place-items-center border-4 bg-black/10 font-extrabold ${ring}`} style={{ width: size, height: size, fontSize: size * 0.32 }} aria-hidden>
      {initialsOf(site.name, site.handle)}
    </div>
  );
}

function MetaChips({ site, onLight, t }: { site: PublicSite; onLight?: boolean; t: ResolvedTheme }) {
  const chip = onLight ? "bg-white/15 text-white/90" : `bg-[var(--pa-soft)] ${t.dark ? "text-[#F2F4F8]" : "text-[var(--pa)]"}`;
  const availability = site.availability || (site.role === "recruiter" ? "Hiring · Recruiter" : "Open to work");
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
      <span className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold ${chip}`}>{availability}</span>
      {site.location && <span className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold ${chip}`}>📍 {site.location}</span>}
      {site.email && <span className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold ${chip}`}>✉️ {site.email}</span>}
    </div>
  );
}

export function Hero({ site, t }: { site: PublicSite; t: ResolvedTheme }) {
  const name = site.name || "@" + site.handle;
  const heading = t.design.serifHeadings ? "font-serif" : "";

  switch (t.design.hero) {
    case "gradient":
      return (
        <header className="relative overflow-hidden text-white text-center px-5 pt-16 pb-12" style={{ background: `linear-gradient(160deg, ${t.accent}, ${tintOf(t.accent, 0.75)} 60%, ${t.accent})` }}>
          <div aria-hidden className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />
          <div aria-hidden className="absolute right-16 -bottom-24 w-52 h-52 rounded-full bg-white/[0.07]" />
          <div className="relative rise">
            <div className="flex justify-center"><Avatar site={site} size={116} ring="border-white/80" /></div>
            <h1 className={`mt-5 font-extrabold tracking-[-0.8px] text-[clamp(30px,5vw,42px)] ${heading}`}>{name}</h1>
            {site.headline && <p className="mt-1.5 text-[17px] text-white/85">{site.headline}</p>}
            <MetaChips site={site} onLight t={t} />
            <HeroActions site={site} onLight />
          </div>
        </header>
      );

    case "dark":
      return (
        <header className="relative overflow-hidden text-center px-5 pt-16 pb-12 bg-[#101319] border-b" style={{ borderColor: tintOf(t.accent, 0.3) }}>
          <div aria-hidden className="absolute left-1/2 -translate-x-1/2 -top-24 w-96 h-96 rounded-full" style={{ background: tintOf(t.accent, 0.12) }} />
          <div className="relative rise">
            <div className="flex justify-center"><Avatar site={site} size={116} ring="border-white/50" /></div>
            <h1 className={`mt-5 font-extrabold tracking-[-0.8px] text-[clamp(30px,5vw,42px)] text-[#F2F4F8] ${heading}`}>{name}</h1>
            <div className="w-10 h-0.5 mx-auto my-3" style={{ background: t.accent }} />
            {site.headline && <p className="text-[16px] text-[#A6ADBB]">{site.headline}</p>}
            <MetaChips site={site} t={t} />
            <HeroActions site={site} />
          </div>
        </header>
      );

    case "banner":
      return (
        <header className="rise">
          <div className="text-white px-5 pt-14 pb-16 text-center" style={{ background: `linear-gradient(135deg, ${t.accent}, ${tintOf(t.accent, 0.8)})` }}>
            <h1 className={`font-extrabold tracking-[-0.8px] text-[clamp(30px,5vw,42px)] ${heading}`}>{name}</h1>
            {site.headline && <p className="mt-1.5 text-[17px] text-white/85">{site.headline}</p>}
          </div>
          <div className="-mt-14 text-center px-5">
            <div className="flex justify-center"><Avatar site={site} size={112} ring={t.dark ? "border-[#14161D]" : "border-white"} /></div>
            <MetaChips site={site} t={t} />
            <HeroActions site={site} />
          </div>
        </header>
      );

    case "split":
      return (
        <header className="max-w-[820px] mx-auto px-5 pt-16 pb-6 rise">
          <div className="flex flex-col-reverse sm:flex-row items-center sm:items-start gap-8">
            <div className="flex-1 text-center sm:text-left">
              <div className="w-9 h-1.5 rounded-full mb-5 mx-auto sm:mx-0" style={{ background: t.accent }} />
              <h1 className={`font-extrabold tracking-[-0.8px] text-[clamp(30px,5vw,42px)] ${heading}`}>{name}</h1>
              {site.headline && <p className={`mt-2 text-[17px] ${t.soft}`}>{site.headline}</p>}
              <div className="sm:-ml-2"><MetaChips site={site} t={t} /></div>
              <div className="sm:-ml-2"><HeroActions site={site} /></div>
            </div>
            <Avatar site={site} size={128} ring={t.dark ? "border-[#2A3040]" : "border-white"} />
          </div>
        </header>
      );

    case "card":
      return (
        <header className="px-5 pt-14 pb-4 rise" style={{ background: tintOf(t.accent, 0.07) }}>
          <div className={`max-w-[680px] mx-auto text-center rounded-3xl px-6 py-10 ${t.card}`}>
            <div className="flex justify-center"><Avatar site={site} size={108} ring={t.dark ? "border-[#2A3040]" : "border-white"} /></div>
            <h1 className={`mt-4 font-extrabold tracking-[-0.6px] text-[clamp(28px,4.5vw,38px)] ${heading}`}>{name}</h1>
            {site.headline && <p className="mt-1 text-[16px] font-semibold" style={{ color: t.accent }}>{site.headline}</p>}
            <MetaChips site={site} t={t} />
            <HeroActions site={site} />
          </div>
        </header>
      );

    case "mono":
      return (
        <header className="px-5 pt-12 pb-4 rise">
          <div className="max-w-[820px] mx-auto rounded-2xl overflow-hidden border" style={{ borderColor: tintOf(t.accent, 0.35), background: "#0E1118" }}>
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1B1F2A] border-b border-[#2A3040]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 text-[12px] text-[#6F7787] font-mono">~/{site.handle}</span>
            </div>
            <div className="px-6 py-7 font-mono">
              <p className="text-[13px] text-[#6F7787]">$ whoami</p>
              <h1 className="mt-2 text-[clamp(26px,4.5vw,36px)] font-bold text-[#F2F4F8]">
                {name}
                <span style={{ color: t.accent }}>_</span>
              </h1>
              {site.headline && (
                <p className="mt-2 text-[15px]" style={{ color: t.accent }}>
                  {site.headline}
                  {site.location && <span className="text-[#A6ADBB]">{`  //  ${site.location}`}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="max-w-[820px] mx-auto text-center">
            <MetaChips site={site} t={t} />
            <HeroActions site={site} />
          </div>
        </header>
      );

    default:
      return (
        <header className="text-center px-5 pt-16 pb-8 rise">
          <div className="flex justify-center"><Avatar site={site} size={116} ring={t.dark ? "border-[#2A3040]" : "border-white"} /></div>
          <h1 className={`mt-5 font-extrabold tracking-[-0.8px] text-[clamp(30px,5vw,42px)] ${heading}`}>{name}</h1>
          {site.headline && <p className={`mt-1.5 text-[17px] ${t.soft}`}>{site.headline}</p>}
          <MetaChips site={site} t={t} />
          <HeroActions site={site} />
        </header>
      );
  }
}
