"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, LayoutGrid, LoaderCircle, Palette, Type, ImageIcon, Pencil, Sparkles, X } from "lucide-react";
import { useDash } from "./Shell";
import { updateMyProfile } from "@/lib/account";
import { callAiTool } from "@/lib/ai/client";
import type { EnhanceResult } from "@/app/api/ai/enhance/route";
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
/** multiplier applied to every paper font size (text-size control). */
const SizeCtx = createContext<number>(1);

/** Keep the resume to a single page: cap free-text fields to a word budget. */
function clampWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length <= max ? text : words.slice(0, max).join(" ") + "…";
}

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
  const sc = useContext(SizeCtx);
  return (
    <div style={{ fontSize: size * sc, lineHeight: `${Math.round(size * sc * 1.4)}px`, color, marginTop: spacingTop, fontStyle: italic ? "italic" : "normal", letterSpacing: tracking, ...f }}>
      {upper && typeof children === "string" ? children.toUpperCase() : children}
    </div>
  );
}

function Section({ title, accent, spec, children }: { title: string; accent: string; spec: TemplateSpec; children: React.ReactNode }) {
  const noRule = spec.rules === false && spec.layout === "single";
  const f = usePaperFont(700, spec.serif);
  const sc = useContext(SizeCtx);
  return (
    <div style={{ marginTop: noRule ? 18 : spec.compact ? 12 : 16 }}>
      <div style={{ fontSize: (spec.compact ? 10 : 11) * sc, letterSpacing: noRule ? 1.8 : 1.2, color: accent, paddingBottom: noRule ? 0 : 3, borderBottom: noRule ? "none" : `1px solid ${RULE}`, ...f }}>
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
  const sc = useContext(SizeCtx);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {skills.slice(0, max).map((s, i) => (
        <div key={s} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: labelColor, fontSize: 8.5 * sc, lineHeight: `${12 * sc}px`, ...f }}>{s}</span>
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
  const sc = useContext(SizeCtx);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ color: pal.title, fontSize: 8.5 * sc, letterSpacing: 1.4, ...f }}>{title.toUpperCase()}</span>
      <div style={{ height: 1, background: pal.rule, marginBottom: 2 }} />
      {children}
    </div>
  );
}

function SideText({ children, pal, faint }: { children: React.ReactNode; pal: SidePalette; faint?: boolean }) {
  const f = usePaperFont(400);
  const sc = useContext(SizeCtx);
  return <span style={{ color: faint ? pal.faint : pal.text, fontSize: 8.5 * sc, lineHeight: `${12 * sc}px`, display: "block", ...f }}>{children}</span>;
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

/** Editor preview — scales the fixed-width paper to fit its column and reserves
 *  the correct (scaled) height. Measures width of the column and natural height
 *  of the paper; both are read synchronously before paint. */
function ScaledPreview({ children, max = 460 }: { children: React.ReactNode; max?: number }) {
  // `sizer` reports the TRUE available width (it has no wide content, so the
  // unscaled BASE-width paper can't inflate the measurement). `inner` gives the
  // paper's natural height so we can reserve the correct scaled height.
  const sizer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const s = sizer.current;
    const i = inner.current;
    if (!s || !i) return;
    const measure = () => setDims({ w: s.clientWidth, h: i.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  const display = Math.min(dims.w || max, max);
  const scale = display / BASE;
  const height = dims.h ? dims.h * scale : display * 1.414;
  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div ref={sizer} style={{ width: "100%", height: 0 }} />
      <div style={{ width: display, height, margin: "0 auto" }}>
        <div ref={inner} style={{ width: BASE, transformOrigin: "top left", transform: `scale(${scale})`, filter: "drop-shadow(0 12px 40px rgba(17,24,39,0.14))" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- editor (presentational) ---------------------------------- */

const btn = "inline-flex items-center justify-center min-h-11 px-5 rounded-2xl font-bold text-[14px] transition cursor-pointer press";
const cardCls = "bg-white border border-line rounded-3xl p-5 shadow-[0_2px_14px_rgba(17,24,39,0.04)]";
const inputCls = "w-full min-h-11 px-3.5 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition";
const FONT_SCALE_MIN = 0.55;
const FONT_SCALE_MAX = 1.2;

type DetailKey = "name" | "headline" | "phone" | "location" | "summary";

interface EditorProps {
  spec: TemplateSpec;
  siblings: TemplateSpec[];
  display: ResumeData;
  bare: boolean;
  counts: { exp: number; edu: number; skills: number };
  accent: string;
  onAccent: (hex: string) => void;
  showPhoto: boolean;
  onPhoto: (b: boolean) => void;
  photoAvailable: boolean;
  fontId: string;
  onFont: (id: string) => void;
  fam: string | null;
  fontScale: number;
  onFontScale: (v: number) => void;
  details: Record<DetailKey, string>;
  onDetail: (key: DetailKey, value: string) => void;
  onEnhance: (kind: "summary" | "headline") => void;
  enhancing: "summary" | "headline" | null;
  onBack: () => void;
  onPickSibling: (t: TemplateSpec) => void;
  onDownload: () => void;
  downloading: boolean;
  onSave: () => void;
  busy: boolean;
  note: string;
  printRef: React.RefObject<HTMLDivElement | null>;
}

type ToolId = "templates" | "color" | "font" | "photo" | "edit" | "ai";

function ResumeEditor(props: EditorProps) {
  const { spec, display, bare, counts, accent, onAccent, showPhoto, onPhoto, photoAvailable, fontId, onFont, fam, fontScale, onFontScale, details, onDetail, onEnhance, enhancing, onBack, onPickSibling, onDownload, downloading, onSave, busy, note, printRef } = props;
  const [tool, setTool] = useState<ToolId | null>(null); // null = no mobile sheet open
  const [family, setFamily] = useState<Kind>(spec.kind); // which family the Templates panel browses

  // 13 layout styles of the browsed family, each rendered in the CURRENT accent so
  // the panel previews the exact look; picking one keeps the color, changing only style.
  const currentStyle = spec.key.split("-")[1];
  const familyStyles: TemplateSpec[] =
    family === "text"
      ? TEXT_STYLES.map((s): TemplateSpec => ({ key: `t-${s.id}`, name: s.name, kind: "text", layout: "single", accent, header: s.header, serif: s.serif, rules: s.rules, compact: s.compact }))
      : VISUAL_STYLES.map((s): TemplateSpec => ({ key: `v-${s.id}`, name: s.name, kind: "visual", layout: s.layout, accent, side: s.side, tone: s.tone, skillBars: s.skillBars, timeline: s.timeline, serif: s.serif, rules: true }));
  const pickStyle = (styleId: string, kind: Kind) => {
    const colorId = COLORS.find((c) => c.hex === accent)?.id ?? "ink";
    const t = TEMPLATES.find((x) => x.key === `${kind === "text" ? "t" : "v"}-${styleId}-${colorId}`);
    if (t) onPickSibling(t);
  };

  const templatesPanel = (
    <div>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {(["visual", "text"] as const).map((k) => (
          <button key={k} onClick={() => setFamily(k)} className={`min-h-9 rounded-[10px] text-[12.5px] font-bold transition ${family === k ? "bg-brand text-white" : "bg-sunken text-ink-2 hover:text-ink"}`}>
            {k === "visual" ? "Visual" : "Text (ATS)"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {familyStyles.map((t) => {
          const sid = t.key.split("-")[1];
          const selected = sid === currentStyle && t.kind === spec.kind;
          return (
            <button key={t.key} onClick={() => pickStyle(sid, t.kind)} className="text-left cursor-pointer group">
              <div className={`rounded-[10px] p-0.5 border-2 ${selected ? "border-brand" : "border-transparent group-hover:border-line"}`}>
                <TemplateThumb spec={t} />
              </div>
              <p className={`text-[11px] font-semibold mt-1 truncate ${selected ? "text-brand" : "text-ink-3"}`}>{t.name}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  const colorPanel = (
    <div className="flex flex-wrap gap-2.5">
      {COLORS.map((c) => (
        <button key={c.id} onClick={() => onAccent(c.hex)} aria-label={`Accent ${c.name}`} className={`w-9 h-9 rounded-full grid place-items-center text-white text-[13px] transition ${c.hex === accent ? "ring-2 ring-offset-2 ring-brand" : ""}`} style={{ background: c.hex }}>
          {c.hex === accent ? "✓" : ""}
        </button>
      ))}
    </div>
  );

  const fontPanel = (
    <div>
      <select value={fontId} onChange={(e) => onFont(e.target.value)} className={`${inputCls} px-3`}>
        {WEB_FONTS.map((f) => (
          <option key={f.id} value={f.id}>{f.id === "system" ? "Default (Manrope)" : f.family}{f.serif ? " (serif)" : ""}</option>
        ))}
      </select>
      <div className="flex items-baseline justify-between mt-4 mb-2">
        <p className="text-[12.5px] font-semibold text-ink-2">Text size</p>
        <span className="text-[12px] font-extrabold text-brand tabular-nums">{Math.round(fontScale * 100)}%</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="text-[10px] font-bold text-ink-3">A</span>
        <input
          type="range"
          min={FONT_SCALE_MIN}
          max={FONT_SCALE_MAX}
          step={0.01}
          value={fontScale}
          onChange={(e) => onFontScale(Number(e.target.value))}
          aria-label="Text size"
          className="flex-1 accent-brand cursor-pointer"
        />
        <span aria-hidden className="text-[16px] font-bold text-ink-3">A</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[11.5px] text-ink-3">Drag to scale — the preview updates live.</p>
        {Math.abs(fontScale - 1) > 0.001 && (
          <button onClick={() => onFontScale(1)} className="text-[11.5px] font-extrabold text-brand cursor-pointer shrink-0">Reset</button>
        )}
      </div>
    </div>
  );

  const photoPanel = (
    <div>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-[14px] font-semibold">Show photo</span>
        <input type="checkbox" checked={showPhoto} onChange={(e) => onPhoto(e.target.checked)} className="w-5 h-5 accent-brand" />
      </label>
      {!photoAvailable && <p className="text-[12px] text-ink-3 mt-1.5">No photo yet — a monogram is shown. Add a photo in the app.</p>}
    </div>
  );

  const enhanceBtn = (kind: "summary" | "headline", disabled: boolean) => (
    <button
      type="button"
      onClick={() => onEnhance(kind)}
      disabled={disabled || enhancing !== null}
      className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-brand cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
    >
      {enhancing === kind ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {enhancing === kind ? "Enhancing…" : "Enhance with AI"}
    </button>
  );

  const detailsPanel = (
    <div className="space-y-2.5">
      <input value={details.name} onChange={(e) => onDetail("name", e.target.value)} placeholder="Full name" className={inputCls} />
      <div>
        <input value={details.headline} onChange={(e) => onDetail("headline", e.target.value)} placeholder="Headline" className={inputCls} />
        <div className="mt-1.5">{enhanceBtn("headline", !details.headline.trim())}</div>
      </div>
      <input value={details.phone} onChange={(e) => onDetail("phone", e.target.value)} placeholder="Phone" className={inputCls} />
      <input value={details.location} onChange={(e) => onDetail("location", e.target.value)} placeholder="Location" className={inputCls} />
      <div>
        <textarea value={details.summary} onChange={(e) => onDetail("summary", e.target.value)} rows={4} placeholder="Professional summary" className={`${inputCls} min-h-0 py-3 resize-y`} />
        <div className="mt-1.5">{enhanceBtn("summary", !details.summary.trim())}</div>
      </div>
      <p className="text-[12px] text-ink-3">Skills, experience & education are edited on the Profile tab.</p>
    </div>
  );

  const aiPanel = (
    <div className="space-y-3">
      <p className="text-[12.5px] text-ink-2 leading-relaxed">Polish what you&apos;ve written — the AI improves wording only, it never invents experience.</p>
      <button
        type="button"
        onClick={() => onEnhance("summary")}
        disabled={!details.summary.trim() || enhancing !== null}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-3 text-left hover:bg-sunken transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {enhancing === "summary" ? <LoaderCircle className="h-4 w-4 animate-spin text-brand shrink-0" /> : <Sparkles className="h-4 w-4 text-brand shrink-0" />}
        <span>
          <span className="block text-[13px] font-extrabold">{enhancing === "summary" ? "Enhancing summary…" : "Enhance my summary"}</span>
          <span className="block text-[11.5px] text-ink-3">Sharper wording, stronger first line, one-page length.</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onEnhance("headline")}
        disabled={!details.headline.trim() || enhancing !== null}
        className="w-full flex items-center gap-2.5 rounded-2xl border border-line px-3.5 py-3 text-left hover:bg-sunken transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
      >
        {enhancing === "headline" ? <LoaderCircle className="h-4 w-4 animate-spin text-brand shrink-0" /> : <Sparkles className="h-4 w-4 text-brand shrink-0" />}
        <span>
          <span className="block text-[13px] font-extrabold">{enhancing === "headline" ? "Enhancing headline…" : "Sharpen my headline"}</span>
          <span className="block text-[11.5px] text-ink-3">Searchable job title first — how recruiters find you.</span>
        </span>
      </button>
      {(!details.summary.trim() || !details.headline.trim()) && (
        <p className="text-[11.5px] text-ink-3">Write something in Details first — the AI polishes your words, it doesn&apos;t start from nothing.</p>
      )}
      <a href="/dashboard/ai/resume-optimizer" className="block text-[12.5px] font-extrabold text-brand">Full resume review → AI Resume Optimizer</a>
    </div>
  );

  const tools: { id: ToolId; label: string; title: string; Icon: typeof LayoutGrid; panel: React.ReactNode }[] = [
    { id: "templates", label: "Templates", title: "Templates", Icon: LayoutGrid, panel: templatesPanel },
    { id: "color", label: "Color", title: "Accent color", Icon: Palette, panel: colorPanel },
    { id: "font", label: "Font", title: "Font", Icon: Type, panel: fontPanel },
    ...(spec.kind === "visual" ? [{ id: "photo" as ToolId, label: "Photo", title: "Photo", Icon: ImageIcon, panel: photoPanel }] : []),
    { id: "edit", label: "Details", title: "Your details", Icon: Pencil, panel: detailsPanel },
    { id: "ai", label: "AI", title: "AI assist", Icon: Sparkles, panel: aiPanel },
  ];
  const activeTool = tools.find((t) => t.id === tool); // mobile sheet
  const deskTool = tools.find((t) => t.id === (tool ?? "templates")) ?? tools[0]; // desktop panel (always one active)

  const Rail = ({ mobile }: { mobile?: boolean }) => (
    <>
      {tools.map((t) => {
        const on = mobile ? tool === t.id : deskTool.id === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(mobile ? (tool === t.id ? null : t.id) : t.id)}
            aria-pressed={on}
            className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition ${mobile ? "flex-1 min-h-[58px]" : `rounded-2xl py-2.5 ${on ? "bg-brand-tonal text-brand" : "text-ink-2 hover:bg-sunken"}`}`}
          >
            <t.Icon className={`h-[20px] w-[20px] ${mobile ? (on ? "text-brand" : "text-ink-2") : ""}`} />
            <span className={`text-[10.5px] font-bold ${mobile ? (on ? "text-brand" : "text-ink-2") : ""}`}>{t.label}</span>
          </button>
        );
      })}
    </>
  );

  return (
    <div className="relative pb-24 lg:pb-0">
      {/* mobile top row — desktop shows back + name inside the left panel */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onBack} aria-label="Back to templates" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-2 hover:text-ink cursor-pointer">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[16px] font-extrabold leading-tight truncate">{spec.name}</h1>
          <p className="text-[11.5px] text-ink-3">{spec.kind === "text" ? "Text · ATS-friendly" : "Visual theme"}</p>
        </div>
        {note && <span className="ml-auto text-[12px] font-semibold text-green-600 truncate">{note}</span>}
      </div>

      {/* desktop: tool rail | active panel | canvas — tools live on the LEFT so
          the resume takes the full remaining width */}
      <div className="mt-3 lg:mt-0 lg:grid lg:grid-cols-[84px_300px_minmax(0,1fr)] lg:gap-4 lg:items-start">
        {/* desktop vertical tool rail */}
        <nav aria-label="Resume tools" className="hidden lg:flex lg:flex-col lg:sticky lg:top-20 gap-1 rounded-3xl border border-line bg-white p-2 shadow-[0_2px_14px_rgba(17,24,39,0.04)]">
          <Rail />
        </nav>

        {/* desktop panel — back + template name on top, then the active tool */}
        <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-3xl border border-line bg-white shadow-[0_2px_14px_rgba(17,24,39,0.04)]">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2.5">
            <button onClick={onBack} aria-label="Back to templates" className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink-2 hover:text-ink transition cursor-pointer shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[14px] font-extrabold leading-tight truncate">{spec.name}</h1>
              <p className="text-[11px] text-ink-3">{spec.kind === "text" ? "Text · ATS-friendly" : "Visual theme"}</p>
            </div>
          </div>
          <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
            <h2 className="text-[13px] font-extrabold">{deskTool.title}</h2>
            {note && <span className="text-[12px] font-semibold text-green-600 truncate">{note}</span>}
          </div>
          <div className="p-4 overflow-y-auto">{deskTool.panel}</div>
        </aside>

        {/* canvas — full remaining width, bigger paper */}
        <div className="rounded-2xl border border-line bg-sunken p-4 sm:p-6">
          <ScaledPreview max={640}>
            <FontCtx.Provider value={fam}>
              <SizeCtx.Provider value={fontScale}>
                <ResumePreview data={display} spec={spec} accent={accent} showPhoto={showPhoto} />
              </SizeCtx.Provider>
            </FontCtx.Provider>
          </ScaledPreview>
          <p className="text-[12px] text-ink-3 text-center mt-3">
            {bare ? "Sample content shown — fill your Profile and it appears here. Samples are never saved or downloaded." : `From your profile · ${counts.exp} exp · ${counts.edu} edu · ${counts.skills} skills`}
          </p>
        </div>
      </div>

      {/* actions — fixed bottom-right so the top stays clear for the resume */}
      <div className="fixed z-40 right-4 bottom-[72px] lg:right-6 lg:bottom-6 flex items-center gap-2">
        <button
          onClick={onDownload}
          disabled={downloading}
          className={`${btn} border border-line bg-white/95 backdrop-blur shadow-[0_10px_36px_rgba(17,24,39,0.14)] hover:bg-sunken disabled:opacity-60 gap-2`}
        >
          {downloading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
        <button
          onClick={onSave}
          disabled={busy}
          className={`${btn} bg-accent hover:bg-accent-pressed text-ink shadow-[0_10px_36px_rgba(17,24,39,0.18)] disabled:opacity-50`}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>

      {/* mobile bottom tool bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1020px] flex"><Rail mobile /></div>
      </div>

      {/* mobile bottom sheet */}
      {activeTool && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTool(null)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-white max-h-[72vh] overflow-y-auto p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-extrabold">{activeTool.title}</h2>
              <button onClick={() => setTool(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl border border-line text-ink cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            {activeTool.panel}
            {note && <p className="text-[13.5px] font-semibold text-green-600 mt-3">{note}</p>}
          </div>
        </div>
      )}

      {/* offscreen, unscaled copy used for the PDF print window — isolated in a
          zero-size clipping box so it can never affect page layout/width */}
      <div aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <div ref={printRef} style={{ width: BASE }}>
          <FontCtx.Provider value={fam}>
            <SizeCtx.Provider value={fontScale}>
              <ResumePreview data={display} spec={spec} accent={accent} showPhoto={showPhoto} />
            </SizeCtx.Provider>
          </FontCtx.Provider>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- screen (stateful) ---------------------------------- */

export default function ResumeBuilder() {
  const { user, profile, refresh } = useDash();

  const savedSpec = useMemo(() => TEMPLATES.find((t) => t.key === profile.resumeTemplate) ?? null, [profile.resumeTemplate]);
  const [spec, setSpec] = useState<TemplateSpec | null>(savedSpec);
  const [tab, setTab] = useState<Kind>("visual");
  const [accent, setAccent] = useState<string>(profile.resumeAccent ?? savedSpec?.accent ?? COLORS[1].hex);
  const [showPhoto, setShowPhoto] = useState<boolean>(profile.resumePhotoOn ?? true);
  const [fontId, setFontId] = useState<string>(profile.resumeFont ?? "system");
  const [fontScale, setFontScale] = useState<number>(profile.resumeFontScale ?? 1);
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

  // Single-page budget: cap free text (About me / experience descriptions) and
  // the number of entries so the resume fits one A4 page at the default size.
  const data: ResumeData = useMemo(
    () => ({
      name,
      headline,
      email: user.email ?? "",
      phone,
      location,
      summary: clampWords(summary, 55),
      skills: (profile.skills ?? []).slice(0, 14),
      experience: (profile.experience ?? []).slice(0, 5).map((e) => ({ role: e.role ?? "", company: e.company ?? "", period: e.period ?? "", description: clampWords(e.description ?? "", 32) })),
      education: (profile.education ?? []).slice(0, 4).map((e) => ({ degree: e.degree ?? "", school: e.school ?? "", year: e.year ?? "" })),
      languages: (profile.languages ?? []).slice(0, 6),
      certificates: (profile.certificates ?? []).slice(0, 4).map((c) => ({ name: c.name ?? "", issuer: c.issuer ?? "", year: c.year ?? "" })),
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
        resumeFontScale: fontScale,
      });
      await refresh().catch(() => {});
      setNote("Saved ✓");
    } catch {
      setNote("Could not save — try again.");
    } finally {
      setBusy(false);
    }
  };

  // Last-resort path when the PDF service is unreachable: print dialog.
  const printFallback = (node: HTMLDivElement) => {
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
    setNote("Choose “Save as PDF” in the dialog.");
  };

  // AI polish for the headline/summary fields — improves the user's own words.
  const [enhancing, setEnhancing] = useState<"summary" | "headline" | null>(null);
  const enhance = async (kind: "summary" | "headline") => {
    const text = kind === "summary" ? summary : headline;
    if (!text.trim() || enhancing) return;
    setEnhancing(kind);
    setNote("");
    try {
      const context = [
        (profile.skills ?? []).length ? `Skills: ${(profile.skills ?? []).join(", ")}` : "",
        (profile.experience ?? []).length ? `Roles: ${(profile.experience ?? []).map((e) => `${e.role} at ${e.company}`).join("; ")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      const res = await callAiTool<EnhanceResult>("enhance", { kind, text, context });
      if (res.improved?.trim()) {
        if (kind === "summary") setSummary(res.improved.trim());
        else setHeadline(res.improved.trim());
        setNote("Enhanced ✨ — review, then Save.");
      }
    } catch {
      setNote("Could not enhance right now — try again.");
    } finally {
      setEnhancing(null);
    }
  };

  const [downloading, setDownloading] = useState(false);
  const download = async () => {
    const node = printRef.current;
    if (!node || downloading) return;
    setDownloading(true);
    setNote("");
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/resume-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ html: node.innerHTML, font: fam ?? "", title: name || "Resume" }),
      });
      if (!res.ok) throw new Error(`pdf ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(name || "Resume").replace(/[^\w\s.-]/g, "").trim() || "Resume"} - Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setNote("PDF downloaded ✓");
    } catch {
      printFallback(node);
    } finally {
      setDownloading(false);
    }
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
  const onDetail = (k: DetailKey, v: string) => {
    if (k === "name") setName(v);
    else if (k === "headline") setHeadline(v);
    else if (k === "phone") setPhone(v);
    else if (k === "location") setLocation(v);
    else setSummary(v);
  };

  return (
    <ResumeEditor
      spec={spec}
      siblings={siblings}
      display={display}
      bare={bare}
      counts={{ exp: data.experience.length, edu: data.education.length, skills: data.skills.length }}
      accent={accent}
      onAccent={setAccent}
      showPhoto={showPhoto}
      onPhoto={setShowPhoto}
      photoAvailable={!!profile.photoUri}
      fontId={fontId}
      onFont={setFontId}
      fam={fam}
      fontScale={fontScale}
      onFontScale={setFontScale}
      details={{ name, headline, phone, location, summary }}
      onDetail={onDetail}
      onBack={() => setSpec(null)}
      onPickSibling={(t) => { setSpec(t); setAccent(t.accent); }}
      onEnhance={enhance}
      enhancing={enhancing}
      onDownload={download}
      downloading={downloading}
      onSave={save}
      busy={busy}
      note={note}
      printRef={printRef}
    />
  );
}
