"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDash } from "./Shell";
import { updateMyProfile } from "@/lib/account";
import { WEB_FONTS } from "@/lib/themes";

/**
 * Resume builder — web port of the app's Canva/Naukri-style builder. Two families:
 * Text (single-column, ATS-friendly documents) and Visual (designed themes with
 * photo, sidebars, skill bars and timelines), each generated as base styles ×
 * accent palette. Preview renders on simulated white paper regardless of app
 * theme; PDF download prints that paper at A4. Content comes from users/{uid}.
 */

const PAPER = "#FFFFFF";
const INK = "#1C1917";
const INK_SOFT = "#57534E";
const INK_FAINT = "#A8A29E";
const RULE = "#D6D3D1";
const SIDE_DARK = "#23211F";

function tintOf(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
}

/** null = app default font (Manrope); otherwise a Google family name. */
const FontCtx = createContext<string | null>(null);

function usePaperFont(weight: number, fallbackSerif?: boolean): React.CSSProperties {
  const fam = useContext(FontCtx);
  if (fam) return { fontFamily: `"${fam}", ${fallbackSerif ? "serif" : "sans-serif"}`, fontWeight: weight };
  return fallbackSerif ? { fontWeight: weight, fontFamily: "Georgia, 'Times New Roman', serif" } : { fontWeight: weight };
}

/* ---------------------------------- catalog ---------------------------------- */

const COLORS: { id: string; name: string; hex: string }[] = [
  { id: "ink", name: "Ink", hex: "#1C1917" },
  { id: "violet", name: "Violet", hex: "#5B4BFF" },
  { id: "navy", name: "Navy", hex: "#1E3A5F" },
  { id: "teal", name: "Teal", hex: "#0F766E" },
  { id: "forest", name: "Forest", hex: "#166534" },
  { id: "plum", name: "Plum", hex: "#7C2D5A" },
  { id: "rust", name: "Rust", hex: "#B45309" },
  { id: "slate", name: "Slate", hex: "#475569" },
];

type Kind = "text" | "visual";
type HeaderKey = "center" | "bar" | "row" | "left" | "banner" | "split";
type SideTone = "dark" | "accent" | "tint";

interface TemplateSpec {
  key: string;
  name: string;
  kind: Kind;
  layout: "single" | "sidebar" | "band";
  accent: string;
  header?: HeaderKey;
  serif?: boolean;
  rules?: boolean;
  compact?: boolean;
  side?: "left" | "right";
  tone?: SideTone;
  skillBars?: boolean;
  timeline?: boolean;
}

const TEXT_STYLES: { id: string; name: string; header: HeaderKey; serif?: boolean; rules?: boolean; compact?: boolean }[] = [
  { id: "classic", name: "Classic", header: "center", rules: true },
  { id: "elegant", name: "Elegant", header: "center", serif: true, rules: true },
  { id: "modern", name: "Modern", header: "bar", rules: true },
  { id: "ledger", name: "Ledger", header: "row", rules: true },
  { id: "compact", name: "Compact", header: "row", rules: true, compact: true },
  { id: "minimal", name: "Minimal", header: "left" },
  { id: "air", name: "Air", header: "center" },
  { id: "editor", name: "Editor", header: "left", serif: true, rules: true },
  { id: "journal", name: "Journal", header: "bar", serif: true, rules: true },
  { id: "banner", name: "Banner", header: "banner", rules: true },
  { id: "brief", name: "Brief", header: "banner", rules: true, compact: true },
  { id: "split", name: "Split", header: "split", rules: true },
  { id: "dense", name: "Dense", header: "left", rules: true, compact: true },
];

const VISUAL_STYLES: { id: string; name: string; layout: "sidebar" | "band"; side?: "left" | "right"; tone?: SideTone; skillBars?: boolean; timeline?: boolean; serif?: boolean }[] = [
  { id: "executive", name: "Executive", layout: "sidebar", side: "left", tone: "dark" },
  { id: "horizon", name: "Horizon", layout: "sidebar", side: "left", tone: "accent" },
  { id: "canvas", name: "Canvas", layout: "sidebar", side: "left", tone: "tint" },
  { id: "mirror", name: "Mirror", layout: "sidebar", side: "right", tone: "dark" },
  { id: "skyline", name: "Skyline", layout: "sidebar", side: "right", tone: "accent" },
  { id: "pearl", name: "Pearl", layout: "sidebar", side: "right", tone: "tint" },
  { id: "impact", name: "Impact", layout: "band" },
  { id: "voyage", name: "Voyage", layout: "band", timeline: true },
  { id: "metric", name: "Metric", layout: "sidebar", side: "left", tone: "dark", skillBars: true },
  { id: "studio", name: "Studio", layout: "sidebar", side: "left", tone: "accent", skillBars: true, timeline: true },
  { id: "gallery", name: "Gallery", layout: "sidebar", side: "right", tone: "tint", skillBars: true },
  { id: "pulse", name: "Pulse", layout: "band", skillBars: true },
  { id: "heritage", name: "Heritage", layout: "sidebar", side: "left", tone: "tint", timeline: true, serif: true },
];

const TEMPLATES: TemplateSpec[] = [
  ...TEXT_STYLES.flatMap((s) =>
    COLORS.map((c) => ({ key: `t-${s.id}-${c.id}`, name: `${s.name} ${c.name}`, kind: "text" as Kind, layout: "single" as const, accent: c.hex, header: s.header, serif: s.serif, rules: s.rules, compact: s.compact }))
  ),
  ...VISUAL_STYLES.flatMap((s) =>
    COLORS.map((c) => ({ key: `v-${s.id}-${c.id}`, name: `${s.name} ${c.name}`, kind: "visual" as Kind, layout: s.layout, accent: c.hex, side: s.side, tone: s.tone, skillBars: s.skillBars, timeline: s.timeline, serif: s.serif, rules: true }))
  ),
];

type Exp = { role: string; company: string; period: string; description: string };
type Edu = { degree: string; school: string; year: string };
type Cert = { name: string; issuer: string; year: string };

interface ResumeData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Exp[];
  education: Edu[];
  languages: string[];
  certificates: Cert[];
  photoUri?: string;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase() : "CV";
}

const SAMPLE: ResumeData = {
  name: "Aarti Sharma",
  headline: "Retail Store Manager",
  email: "aarti.sharma@email.com",
  phone: "+91 98765 43210",
  location: "Patna, Bihar",
  summary: "Customer-focused retail professional with 4+ years leading store teams, improving sales and delivering a great shopping experience every day.",
  skills: ["Customer Service", "Team Leadership", "Billing & POS", "Inventory", "Merchandising", "MS Excel"],
  experience: [
    { role: "Store Manager", company: "Trends Fashion, Patna", period: "2023 – Present", description: "Lead a team of 12 associates; grew monthly sales 18% and cut stock losses by a third." },
    { role: "Sales Associate", company: "Big Bazaar", period: "2021 – 2023", description: "Rated top associate for customer satisfaction three quarters in a row." },
  ],
  education: [
    { degree: "B.Com", school: "Patna University", year: "2021" },
    { degree: "Class XII (Commerce)", school: "DAV Public School", year: "2018" },
  ],
  languages: ["Hindi", "English"],
  certificates: [{ name: "Retail Operations Certificate", issuer: "NSDC", year: "2022" }],
};

/* ---------------------------------- paper primitives ---------------------------------- */

function PaperText({
  children,
  size = 11,
  weight = 400,
  color = INK,
  spacingTop = 0,
  italic = false,
  upper = false,
  tracking = 0,
  serif = false,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: 400 | 500 | 600 | 700;
  color?: string;
  spacingTop?: number;
  italic?: boolean;
  upper?: boolean;
  tracking?: number;
  serif?: boolean;
}) {
  const f = usePaperFont(weight, serif);
  return (
    <div style={{ fontSize: size, lineHeight: `${Math.round(size * 1.4)}px`, color, marginTop: spacingTop, fontStyle: italic ? "italic" : "normal", letterSpacing: tracking, ...f }}>
      {upper && typeof children === "string" ? children.toUpperCase() : children}
    </div>
  );
}

function Section({ title, accent, spec, children }: { title: string; accent: string; spec: TemplateSpec; children: React.ReactNode }) {
  const noRule = spec.rules === false && spec.layout === "single";
  const f = usePaperFont(700, spec.serif);
  return (
    <div style={{ marginTop: noRule ? 18 : spec.compact ? 12 : 16 }}>
      <div style={{ fontSize: spec.compact ? 10 : 11, letterSpacing: noRule ? 1.8 : 1.2, color: accent, paddingBottom: noRule ? 0 : 3, borderBottom: noRule ? "none" : `1px solid ${RULE}`, ...f }}>
        {title.toUpperCase()}
      </div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function EntryBlock({ title, sub, meta, desc, spec }: { title: string; sub: string; meta?: string; desc?: string; spec: TemplateSpec }) {
  const { compact, serif } = spec;
  return (
    <div style={{ marginBottom: compact ? 6 : 9 }}>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <PaperText size={compact ? 11 : 12} weight={600} serif={serif}>{title}</PaperText>
        {meta ? <PaperText size={compact ? 9.5 : 10} color={INK_FAINT} serif={serif}>{meta}</PaperText> : null}
      </div>
      {sub ? <PaperText size={compact ? 10 : 11} color={INK_SOFT} serif={serif}>{sub}</PaperText> : null}
      {desc ? <PaperText size={compact ? 10 : 11} color={INK_SOFT} spacingTop={2} serif={serif}>{desc}</PaperText> : null}
    </div>
  );
}

function ContactLine({ d, sep = "  •  ", color = INK_SOFT, serif }: { d: ResumeData; sep?: string; color?: string; serif?: boolean }) {
  const bits = [d.email, d.phone, d.location].filter(Boolean);
  return bits.length ? <PaperText size={10} color={color} serif={serif}>{bits.join(sep)}</PaperText> : null;
}

function PhotoCircle({ uri, initials, size, fg, bg, ring }: { uri?: string; initials: string; size: number; fg: string; bg: string; ring: string }) {
  if (uri) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={uri} alt="" style={{ width: size, height: size, borderRadius: size / 2, border: `2px solid ${ring}`, objectFit: "cover" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: bg, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${ring}` }}>
      <span style={{ color: fg, fontSize: size * 0.34, fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

function TimelineList({ items, accent, spec }: { items: Exp[]; accent: string; spec: TemplateSpec }) {
  return (
    <div>
      {items.map((e, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <div style={{ width: 10, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: 3.5, background: accent, marginTop: 4 }} />
            {i < items.length - 1 ? <div style={{ width: 1.5, flex: 1, background: RULE }} /> : null}
          </div>
          <div style={{ flex: 1 }}>
            <EntryBlock title={e.role} sub={e.company} meta={e.period} desc={e.description} spec={spec} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillBars({ skills, track, fill, labelColor, max = 8 }: { skills: string[]; track: string; fill: string; labelColor: string; max?: number }) {
  const f = usePaperFont(400);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {skills.slice(0, max).map((s, i) => (
        <div key={s} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: labelColor, fontSize: 8.5, lineHeight: "12px", ...f }}>{s}</span>
          <div style={{ height: 4, borderRadius: 2, background: track, overflow: "hidden" }}>
            <div style={{ width: `${58 + ((i * 37) % 38)}%`, height: "100%", borderRadius: 2, background: fill }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- visual layouts ---------------------------------- */

interface SidePalette {
  bg: string;
  title: string;
  text: string;
  faint: string;
  rule: string;
  barTrack: string;
  barFill: string;
  photoBg: string;
  photoFg: string;
  photoRing: string;
}

function sidePalette(tone: SideTone, accent: string): SidePalette {
  if (tone === "tint") {
    return { bg: tintOf(accent, 0.09), title: accent, text: INK, faint: INK_SOFT, rule: tintOf(accent, 0.35), barTrack: tintOf(accent, 0.18), barFill: accent, photoBg: tintOf(accent, 0.2), photoFg: accent, photoRing: tintOf(accent, 0.5) };
  }
  return { bg: tone === "dark" ? SIDE_DARK : accent, title: "#FFFFFF", text: "#FFFFFF", faint: "rgba(255,255,255,0.78)", rule: "rgba(255,255,255,0.28)", barTrack: "rgba(255,255,255,0.25)", barFill: "#FFFFFF", photoBg: "rgba(255,255,255,0.18)", photoFg: "#FFFFFF", photoRing: "rgba(255,255,255,0.65)" };
}

function SideBlock({ title, pal, children }: { title: string; pal: SidePalette; children: React.ReactNode }) {
  const f = usePaperFont(700);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ color: pal.title, fontSize: 8.5, letterSpacing: 1.4, ...f }}>{title.toUpperCase()}</span>
      <div style={{ height: 1, background: pal.rule, marginBottom: 2 }} />
      {children}
    </div>
  );
}

function SideText({ children, pal, faint }: { children: React.ReactNode; pal: SidePalette; faint?: boolean }) {
  const f = usePaperFont(400);
  return <span style={{ color: faint ? pal.faint : pal.text, fontSize: 8.5, lineHeight: "12px", display: "block", ...f }}>{children}</span>;
}

function SidebarResume({ data, spec, accent, showPhoto }: { data: ResumeData; spec: TemplateSpec; accent: string; showPhoto: boolean }) {
  const pal = sidePalette(spec.tone ?? "dark", accent);
  const headingAccent = spec.tone === "dark" ? INK : accent;

  const sidebar = (
    <div style={{ width: "35%", background: pal.bg, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
      {showPhoto ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PhotoCircle uri={data.photoUri} initials={initialsOf(data.name)} size={58} fg={pal.photoFg} bg={pal.photoBg} ring={pal.photoRing} />
        </div>
      ) : null}
      <SideBlock title="Contact" pal={pal}>
        {data.phone ? <SideText pal={pal} faint>{data.phone}</SideText> : null}
        {data.email ? <SideText pal={pal} faint>{data.email}</SideText> : null}
        {data.location ? <SideText pal={pal} faint>{data.location}</SideText> : null}
      </SideBlock>
      {data.education.length ? (
        <SideBlock title="Education" pal={pal}>
          {data.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              <SideText pal={pal}>{e.degree}</SideText>
              <SideText pal={pal} faint>{[e.school, e.year].filter(Boolean).join(" · ")}</SideText>
            </div>
          ))}
        </SideBlock>
      ) : null}
      {data.skills.length ? (
        <SideBlock title="Skills" pal={pal}>
          {spec.skillBars ? (
            <SkillBars skills={data.skills} track={pal.barTrack} fill={pal.barFill} labelColor={pal.text} />
          ) : (
            data.skills.slice(0, 10).map((s) => <SideText key={s} pal={pal} faint>{"•  "}{s}</SideText>)
          )}
        </SideBlock>
      ) : null}
      {data.languages.length ? (
        <SideBlock title="Languages" pal={pal}>
          {data.languages.map((l) => <SideText key={l} pal={pal} faint>{"•  "}{l}</SideText>)}
        </SideBlock>
      ) : null}
    </div>
  );

  const main = (
    <div style={{ flex: 1, padding: "16px 14px" }}>
      <PaperText size={19} weight={700} tracking={0.5} serif={spec.serif}>{(data.name || "Your Name").toUpperCase()}</PaperText>
      {data.headline ? (
        <PaperText size={10} weight={600} color={spec.tone === "dark" ? INK_SOFT : accent} tracking={1.2} spacingTop={2} upper serif={spec.serif}>{data.headline}</PaperText>
      ) : null}
      {data.summary ? (
        <Section title="About me" accent={headingAccent} spec={spec}>
          <PaperText size={10} color={INK_SOFT} serif={spec.serif}>{data.summary}</PaperText>
        </Section>
      ) : null}
      {data.experience.length ? (
        <Section title="Experience" accent={headingAccent} spec={spec}>
          {spec.timeline ? <TimelineList items={data.experience} accent={accent} spec={spec} /> : data.experience.map((e, i) => <EntryBlock key={i} title={e.role} sub={e.company} meta={e.period} desc={e.description} spec={spec} />)}
        </Section>
      ) : null}
      {data.certificates.length ? (
        <Section title="Certifications" accent={headingAccent} spec={spec}>
          {data.certificates.map((c, i) => <EntryBlock key={i} title={c.name} sub={[c.issuer, c.year].filter(Boolean).join(" · ")} spec={spec} />)}
        </Section>
      ) : null}
    </div>
  );

  return (
    <div style={{ background: PAPER, borderRadius: 6, border: `1px solid ${RULE}`, overflow: "hidden", display: "flex", flexDirection: spec.side === "right" ? "row-reverse" : "row" }}>
      {sidebar}
      {main}
    </div>
  );
}

function BandResume({ data, spec, accent, showPhoto }: { data: ResumeData; spec: TemplateSpec; accent: string; showPhoto: boolean }) {
  return (
    <div style={{ background: PAPER, borderRadius: 6, border: `1px solid ${RULE}`, overflow: "hidden" }}>
      <div style={{ background: accent, padding: "16px", display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
        {showPhoto ? <PhotoCircle uri={data.photoUri} initials={initialsOf(data.name)} size={54} fg="#FFFFFF" bg="rgba(255,255,255,0.18)" ring="rgba(255,255,255,0.65)" /> : null}
        <div style={{ flex: 1 }}>
          <PaperText size={20} weight={700} color={PAPER}>{data.name || "Your Name"}</PaperText>
          {data.headline ? <PaperText size={11} color="#FFFFFFDD" spacingTop={1}>{data.headline}</PaperText> : null}
          <div style={{ marginTop: 4 }}><ContactLine d={data} color="#FFFFFFCC" /></div>
        </div>
      </div>
      <div style={{ padding: 16, paddingTop: 4 }}>
        {data.summary ? (
          <Section title="Summary" accent={accent} spec={spec}><PaperText size={11} color={INK_SOFT}>{data.summary}</PaperText></Section>
        ) : null}
        {data.experience.length ? (
          <Section title="Experience" accent={accent} spec={spec}>
            {spec.timeline ? <TimelineList items={data.experience} accent={accent} spec={spec} /> : data.experience.map((e, i) => <EntryBlock key={i} title={e.role} sub={e.company} meta={e.period} desc={e.description} spec={spec} />)}
          </Section>
        ) : null}
        {data.education.length ? (
          <Section title="Education" accent={accent} spec={spec}>
            {data.education.map((e, i) => <EntryBlock key={i} title={e.degree} sub={e.school} meta={e.year} spec={spec} />)}
          </Section>
        ) : null}
        {data.skills.length ? (
          <Section title="Skills" accent={accent} spec={spec}>
            {spec.skillBars ? (
              <div style={{ width: "75%" }}><SkillBars skills={data.skills} track={tintOf(accent, 0.15)} fill={accent} labelColor={INK_SOFT} /></div>
            ) : (
              <PaperText size={11} color={INK_SOFT}>{data.skills.join("  ·  ")}</PaperText>
            )}
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function SingleResume({ data, spec, accent }: { data: ResumeData; spec: TemplateSpec; accent: string }) {
  const { compact, serif } = spec;
  const pad = compact ? 18 : 22;
  const name = data.name || "Your Name";
  const banner = spec.header === "banner";

  return (
    <div style={{ background: PAPER, borderRadius: 6, padding: banner ? 0 : pad, border: `1px solid ${RULE}`, overflow: "hidden" }}>
      {spec.header === "center" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: spec.rules === false ? "none" : `${serif ? 1 : 2}px solid ${INK}`, paddingBottom: serif ? 12 : 10 }}>
          <PaperText size={serif ? 24 : 22} weight={serif ? 600 : 700} serif={serif} tracking={serif ? 1 : 0}>{name}</PaperText>
          {data.headline ? <PaperText size={serif ? 11 : 12} color={INK_SOFT} italic={serif} serif={serif} spacingTop={2}>{data.headline}</PaperText> : null}
          <div style={{ marginTop: 6 }}><ContactLine d={data} sep={serif ? "   ·   " : "  •  "} serif={serif} /></div>
        </div>
      )}

      {spec.header === "bar" && (
        <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "stretch" }}>
          <div style={{ width: 4, borderRadius: 2, background: accent }} />
          <div style={{ flex: 1 }}>
            <PaperText size={22} weight={700} color={accent} serif={serif}>{name}</PaperText>
            {data.headline ? <PaperText size={12} spacingTop={1} serif={serif}>{data.headline}</PaperText> : null}
            <div style={{ marginTop: 5 }}><ContactLine d={data} serif={serif} /></div>
          </div>
        </div>
      )}

      {spec.header === "row" && (
        <div>
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 8 }}>
            <PaperText size={18} weight={700}>{name}</PaperText>
            {data.headline ? <PaperText size={10} color={INK_SOFT}>{data.headline}</PaperText> : null}
          </div>
          <div style={{ marginTop: 2 }}><ContactLine d={data} sep="  |  " /></div>
        </div>
      )}

      {spec.header === "left" && (
        <div>
          <PaperText size={21} weight={600} tracking={0.2} serif={serif}>{name}</PaperText>
          {data.headline ? <PaperText size={11} color={INK_SOFT} spacingTop={2} serif={serif}>{data.headline}</PaperText> : null}
          <div style={{ marginTop: 5 }}><ContactLine d={data} serif={serif} /></div>
        </div>
      )}

      {spec.header === "split" && (
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1.5px solid ${accent}`, paddingBottom: 8, gap: 8 }}>
          <div style={{ flexShrink: 1 }}>
            <PaperText size={20} weight={700}>{name}</PaperText>
            {data.headline ? <PaperText size={11} color={INK_SOFT} spacingTop={1}>{data.headline}</PaperText> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            {[data.email, data.phone, data.location].filter(Boolean).map((b) => <PaperText key={b} size={9} color={INK_SOFT}>{b}</PaperText>)}
          </div>
        </div>
      )}

      {banner && (
        <div style={{ background: accent, padding: `14px ${pad}px` }}>
          <PaperText size={22} weight={700} color={PAPER}>{name}</PaperText>
          {data.headline ? <PaperText size={12} color="#FFFFFFDD" spacingTop={2}>{data.headline}</PaperText> : null}
          <div style={{ marginTop: 6 }}><ContactLine d={data} color="#FFFFFFCC" /></div>
        </div>
      )}

      <div style={banner ? { padding: `0 ${pad}px ${pad}px` } : undefined}>
        {data.summary ? (
          <Section title="Summary" accent={accent} spec={spec}><PaperText size={compact ? 10 : 11} color={INK_SOFT} serif={serif}>{data.summary}</PaperText></Section>
        ) : null}
        {data.experience.length ? (
          <Section title="Experience" accent={accent} spec={spec}>
            {data.experience.map((e, i) => <EntryBlock key={i} title={e.role} sub={e.company} meta={e.period} desc={e.description} spec={spec} />)}
          </Section>
        ) : null}
        {data.education.length ? (
          <Section title="Education" accent={accent} spec={spec}>
            {data.education.map((e, i) => <EntryBlock key={i} title={e.degree} sub={e.school} meta={e.year} spec={spec} />)}
          </Section>
        ) : null}
        {data.skills.length ? (
          <Section title="Skills" accent={accent} spec={spec}><PaperText size={compact ? 10 : 11} color={INK_SOFT} serif={serif}>{data.skills.join("  ·  ")}</PaperText></Section>
        ) : null}
        {!data.summary && !data.experience.length && !data.education.length && !data.skills.length ? (
          <PaperText size={11} color={INK_FAINT} spacingTop={16}>Add details in your profile to fill out this resume.</PaperText>
        ) : null}
      </div>
    </div>
  );
}

function ResumePreview({ data, spec, accent, showPhoto }: { data: ResumeData; spec: TemplateSpec; accent: string; showPhoto: boolean }) {
  if (spec.layout === "sidebar") return <SidebarResume data={data} spec={spec} accent={accent} showPhoto={showPhoto} />;
  if (spec.layout === "band") return <BandResume data={data} spec={spec} accent={accent} showPhoto={showPhoto} />;
  return <SingleResume data={data} spec={spec} accent={accent} />;
}

/* ---------------------------------- scaling helpers ---------------------------------- */

const BASE = 360; // natural paper width; everything else is scaled from here

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Gallery thumbnail — the real renderer with sample data, scaled to the cell. */
function TemplateThumb({ spec }: { spec: TemplateSpec }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const scale = w ? w / BASE : 0;
  return (
    <div ref={ref} style={{ width: "100%", height: w ? w * 1.414 : 0, borderRadius: 10, border: `1px solid ${RULE}`, background: PAPER, overflow: "hidden", position: "relative" }}>
      {w > 0 && (
        <div style={{ width: BASE, transformOrigin: "top left", transform: `scale(${scale})` }}>
          <ResumePreview data={SAMPLE} spec={spec} accent={spec.accent} showPhoto={spec.kind === "visual"} />
        </div>
      )}
    </div>
  );
}

/** Editor preview — measures natural height and scales the paper to fit the column. */
function ScaledPreview({ children }: { children: React.ReactNode }) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const innerRef = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(BASE * 1.414);
  const display = Math.min(width || BASE, 460);
  const scale = display / BASE;
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  });
  return (
    <div ref={wrapRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: display, height: h * scale }}>
        <div ref={innerRef} style={{ width: BASE, transformOrigin: "top left", transform: `scale(${scale})`, filter: "drop-shadow(0 12px 40px rgba(17,24,39,0.12))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- screen ---------------------------------- */

const btn = "inline-flex items-center justify-center min-h-11 px-5 rounded-2xl font-bold text-[14px] transition cursor-pointer press";
const cardCls = "bg-white border border-line rounded-3xl p-5 shadow-[0_2px_14px_rgba(17,24,39,0.04)]";

export default function ResumeBuilder() {
  const { user, profile, refresh } = useDash();

  const savedSpec = useMemo(() => TEMPLATES.find((t) => t.key === profile.resumeTemplate) ?? null, [profile.resumeTemplate]);
  const [spec, setSpec] = useState<TemplateSpec | null>(savedSpec);
  const [tab, setTab] = useState<Kind>("visual");
  const [accent, setAccent] = useState<string>(profile.resumeAccent ?? savedSpec?.accent ?? COLORS[1].hex);
  const [showPhoto, setShowPhoto] = useState<boolean>(profile.resumePhotoOn ?? true);
  const [fontId, setFontId] = useState<string>(profile.resumeFont ?? "system");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  // editable header details, seeded from the profile (saved back on Save)
  const [name, setName] = useState(profile.fullName ?? user.displayName ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [summary, setSummary] = useState(profile.summary ?? "");

  const activeFont = WEB_FONTS.find((f) => f.id === fontId) ?? WEB_FONTS[0];
  const fam = fontId === "system" ? null : activeFont.family;

  // load the chosen Google font for the preview
  useEffect(() => {
    if (!fam) return;
    const id = `gf-${fam.replace(/\s/g, "")}`;
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, "+")}:wght@400;600;700&display=swap`;
    document.head.appendChild(l);
  }, [fam]);

  const data: ResumeData = useMemo(
    () => ({
      name,
      headline,
      email: user.email ?? "",
      phone,
      location,
      summary,
      skills: profile.skills ?? [],
      experience: (profile.experience ?? []).map((e) => ({ role: e.role ?? "", company: e.company ?? "", period: e.period ?? "", description: e.description ?? "" })),
      education: (profile.education ?? []).map((e) => ({ degree: e.degree ?? "", school: e.school ?? "", year: e.year ?? "" })),
      languages: profile.languages ?? [],
      certificates: (profile.certificates ?? []).map((c) => ({ name: c.name ?? "", issuer: c.issuer ?? "", year: c.year ?? "" })),
      photoUri: profile.photoUri || undefined,
    }),
    [name, headline, phone, location, summary, user.email, profile.skills, profile.experience, profile.education, profile.languages, profile.certificates, profile.photoUri]
  );

  // Canva-style: only a fully empty profile borrows sample content so designs read finished.
  const bare = !data.experience.length && !data.education.length && !data.skills.length && !data.summary;
  const display: ResumeData = bare ? { ...SAMPLE, name: data.name || SAMPLE.name, email: data.email || SAMPLE.email, photoUri: data.photoUri } : data;

  const printRef = useRef<HTMLDivElement>(null);

  const pickTemplate = (t: TemplateSpec) => {
    setSpec(t);
    setAccent(profile.resumeTemplate === t.key && profile.resumeAccent ? profile.resumeAccent : t.accent);
    setShowPhoto(profile.resumeTemplate === t.key && profile.resumePhotoOn != null ? profile.resumePhotoOn : t.kind === "visual");
  };

  const save = async () => {
    if (!spec) return;
    setBusy(true);
    setNote("");
    try {
      await updateMyProfile(user.uid, {
        fullName: name.trim() || profile.fullName || "",
        headline: headline.trim(),
        phone: phone.trim(),
        location: location.trim(),
        summary: summary.trim(),
        resumeTemplate: spec.key,
        resumeAccent: accent,
        resumePhotoOn: showPhoto,
        resumeFont: fontId,
      });
      await refresh().catch(() => {});
      setNote("Saved ✓");
    } catch {
      setNote("Could not save — try again.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const node = printRef.current;
    if (!node) return;
    const link = fam ? `<link href="https://fonts.googleapis.com/css2?family=${fam.replace(/ /g, "+")}:wght@400;600;700&display=swap" rel="stylesheet">` : "";
    const w = window.open("", "_blank", "width=880,height=1200");
    if (!w) {
      setNote("Allow pop-ups to download the PDF.");
      return;
    }
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${(name || "Resume").replace(/</g, "")} — Resume</title>${link}` +
        `<style>@page{size:A4;margin:10mm;}html,body{margin:0;padding:0;background:#fff;}` +
        `#wrap{width:${BASE}px;zoom:2.05;}#wrap>*{border:none!important;border-radius:0!important;box-shadow:none!important;}` +
        `*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head>` +
        `<body><div id="wrap">${node.innerHTML}</div>` +
        `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},500);};<\/script></body></html>`
    );
    w.document.close();
  };

  /* ------------ gallery ------------ */
  if (!spec) {
    const list = TEMPLATES.filter((t) => t.kind === tab);
    return (
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Resume builder</h1>
        <p className="text-ink-2 text-[14px] mt-1 max-w-[600px]">
          Pick a template — your profile fills it in automatically. Text templates are single-column and easiest for employer software (ATS); Visual themes add photo, sidebars and skill bars.
        </p>

        <div className="mt-4 inline-flex bg-sunken rounded-[14px] p-1.5">
          {(["visual", "text"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`min-h-10 px-4 rounded-[10px] text-[13.5px] font-bold transition ${tab === k ? "bg-white text-brand shadow-[0_2px_8px_rgba(17,24,39,0.08)]" : "text-ink-2"}`}>
              {k === "visual" ? "Visual themes" : "Text (ATS)"}
            </button>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-3 mt-2">{list.length} designs</p>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((t) => (
            <button key={t.key} onClick={() => pickTemplate(t)} className="text-left group">
              <div className="rounded-[12px] overflow-hidden border border-transparent group-hover:border-brand transition">
                <TemplateThumb spec={t} />
              </div>
              <p className="text-[12.5px] font-semibold mt-1.5 truncate">{t.name}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ------------ editor ------------ */
  const siblings = TEMPLATES.filter((t) => t.kind === spec.kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setSpec(null)} className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-ink-2 hover:text-ink cursor-pointer">
          ← Templates
        </button>
        <div className="flex-1 min-w-[120px]">
          <h1 className="text-[18px] font-extrabold leading-tight">{spec.name}</h1>
          <p className="text-[12px] text-ink-3">{spec.kind === "text" ? "Text · ATS-friendly" : "Visual theme"}</p>
        </div>
        <button onClick={download} className={`${btn} border border-line hover:bg-sunken`}>Download PDF</button>
        <button onClick={save} disabled={busy} className={`${btn} bg-accent hover:bg-accent-pressed text-ink disabled:opacity-50`}>{busy ? "Saving…" : "Save"}</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px] items-start">
        {/* preview */}
        <div className="lg:sticky lg:top-20">
          <ScaledPreview>
            <FontCtx.Provider value={fam}>
              <ResumePreview data={display} spec={spec} accent={accent} showPhoto={showPhoto} />
            </FontCtx.Provider>
          </ScaledPreview>
          <p className="text-[12px] text-ink-3 text-center mt-3">
            {bare
              ? "Showing sample content — fill your Profile and it appears here. Samples are never saved or downloaded."
              : `From your profile · ${data.experience.length} exp · ${data.education.length} edu · ${data.skills.length} skills`}
          </p>
        </div>

        {/* controls */}
        <div className="space-y-4">
          <section className={cardCls}>
            <h2 className="text-[14px] font-extrabold">{spec.kind === "text" ? "Text templates" : "Visual themes"}</h2>
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {siblings.map((t) => (
                <button key={t.key} onClick={() => { setSpec(t); setAccent(t.accent); }} className="shrink-0 w-[84px] text-left cursor-pointer">
                  <div className={`rounded-[10px] p-0.5 border-2 ${t.key === spec.key ? "border-brand" : "border-transparent"}`}>
                    <TemplateThumb spec={t} />
                  </div>
                  <p className={`text-[11px] font-semibold mt-1 truncate text-center ${t.key === spec.key ? "text-brand" : "text-ink-3"}`}>{t.name.split(" ")[0]}</p>
                </button>
              ))}
            </div>
          </section>

          <section className={cardCls}>
            <h2 className="text-[14px] font-extrabold">Accent color</h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAccent(c.hex)}
                  aria-label={`Accent ${c.name}`}
                  className={`w-9 h-9 rounded-full grid place-items-center text-white text-[13px] transition ${c.hex === accent ? "ring-2 ring-offset-2 ring-brand" : ""}`}
                  style={{ background: c.hex }}
                >
                  {c.hex === accent ? "✓" : ""}
                </button>
              ))}
            </div>
          </section>

          <section className={cardCls}>
            <h2 className="text-[14px] font-extrabold">Font</h2>
            <select value={fontId} onChange={(e) => setFontId(e.target.value)} className="mt-3 w-full min-h-11 px-3 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition">
              {WEB_FONTS.map((f) => (
                <option key={f.id} value={f.id}>{f.id === "system" ? "Default (Manrope)" : f.family}{f.serif ? " (serif)" : ""}</option>
              ))}
            </select>
          </section>

          {spec.kind === "visual" && (
            <section className={cardCls}>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[14px] font-extrabold">Show photo</span>
                <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="w-5 h-5 accent-brand" />
              </label>
              {!profile.photoUri && <p className="text-[12px] text-ink-3 mt-1.5">No photo yet — a monogram is shown. Add a photo in the app.</p>}
            </section>
          )}

          <section className={cardCls}>
            <h2 className="text-[14px] font-extrabold">Your details</h2>
            <p className="text-[12px] text-ink-3 mt-1">Saved to your profile. Skills, experience & education are edited on the Profile tab.</p>
            <div className="mt-3 space-y-2.5">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full min-h-11 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition" />
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline" className="w-full min-h-11 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full min-h-11 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full min-h-11 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition" />
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="Professional summary" className="w-full py-3 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition resize-y" />
            </div>
          </section>

          {note && <p className="text-[13.5px] font-semibold text-green-600">{note}</p>}
        </div>
      </div>

      {/* offscreen, unscaled copy used for the PDF print window */}
      <div ref={printRef} aria-hidden style={{ position: "absolute", left: -100000, top: 0, width: BASE, pointerEvents: "none" }}>
        <FontCtx.Provider value={fam}>
          <ResumePreview data={display} spec={spec} accent={accent} showPhoto={showPhoto} />
        </FontCtx.Provider>
      </div>
    </div>
  );
}
