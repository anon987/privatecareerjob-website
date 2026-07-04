import type { PublicSite } from "./site";

/**
 * v2 portfolio theme system. A theme = design structure (hero layout, dark/light,
 * card style) + accent color + font family. The app writes `design {id, accent,
 * font, fontFamily}`; docs published before v2 fall back via the legacy
 * template/font keys. Accent-dependent colors flow through CSS variables
 * (--pa, --pa-soft, --pa-line) set inline on the page root.
 */

export type HeroKey = "gradient" | "dark" | "banner" | "split" | "card" | "mono" | "centered";

export interface DesignDef {
  id: string;
  name: string;
  field: string;
  hero: HeroKey;
  accent: string;
  dark?: boolean;
  serifHeadings?: boolean;
  galleryFirst?: boolean;
  projectsFirst?: boolean;
}

/** Mirrors the app's PORTFOLIO_DESIGNS (src/lib/publicProfile.ts) — keep in sync. */
export const DESIGNS: DesignDef[] = [
  { id: "devfolio", name: "Devfolio", field: "Tech", hero: "mono", accent: "#22C55E", dark: true, projectsFirst: true },
  { id: "studio", name: "Studio", field: "Design", hero: "gradient", accent: "#5B4BFF", galleryFirst: true },
  { id: "pitch", name: "Pitch", field: "Sales", hero: "split", accent: "#1E3A5F" },
  { id: "counter", name: "Counter", field: "Retail", hero: "banner", accent: "#D97706" },
  { id: "chalk", name: "Chalk", field: "Education", hero: "card", accent: "#7C2D5A", serifHeadings: true },
  { id: "care", name: "Care", field: "Healthcare", hero: "card", accent: "#0F766E" },
  { id: "freight", name: "Freight", field: "Logistics", hero: "banner", accent: "#334155" },
  { id: "ledger", name: "Ledger", field: "Finance", hero: "split", accent: "#166534", serifHeadings: true },
  { id: "host", name: "Host", field: "Hospitality", hero: "gradient", accent: "#E11D48", galleryFirst: true },
  { id: "spotlight", name: "Spotlight", field: "General", hero: "dark", accent: "#C9A24B", dark: true },
];

export const ACCENTS: { id: string; name: string; hex: string }[] = [
  { id: "violet", name: "Violet", hex: "#5B4BFF" },
  { id: "indigo", name: "Indigo", hex: "#4338CA" },
  { id: "teal", name: "Teal", hex: "#0F766E" },
  { id: "emerald", name: "Emerald", hex: "#059669" },
  { id: "rose", name: "Rose", hex: "#E11D48" },
  { id: "amber", name: "Amber", hex: "#D97706" },
  { id: "slate", name: "Slate", hex: "#334155" },
  { id: "gold", name: "Gold", hex: "#C9A24B" },
];

/** Mirrors the app's font catalog ids → Google Fonts family names. */
export const WEB_FONTS: { id: string; family: string; serif?: boolean }[] = [
  { id: "system", family: "Manrope" },
  { id: "inter", family: "Inter" },
  { id: "roboto", family: "Roboto" },
  { id: "opensans", family: "Open Sans" },
  { id: "lato", family: "Lato" },
  { id: "montserrat", family: "Montserrat" },
  { id: "poppins", family: "Poppins" },
  { id: "raleway", family: "Raleway" },
  { id: "worksans", family: "Work Sans" },
  { id: "rubik", family: "Rubik" },
  { id: "karla", family: "Karla" },
  { id: "mulish", family: "Mulish" },
  { id: "barlow", family: "Barlow" },
  { id: "playfair", family: "Playfair Display", serif: true },
  { id: "merriweather", family: "Merriweather", serif: true },
  { id: "lora", family: "Lora", serif: true },
  { id: "garamond", family: "EB Garamond", serif: true },
  { id: "baskerville", family: "Libre Baskerville", serif: true },
  { id: "crimson", family: "Crimson Pro", serif: true },
  { id: "spectral", family: "Spectral", serif: true },
  { id: "ptserif", family: "PT Serif", serif: true },
];

/** Legacy template key → nearest v2 design (docs published before v2). */
const LEGACY_DESIGN: Record<string, string> = {
  aurora: "studio",
  paper: "chalk",
  noir: "spotlight",
  banner: "counter",
};

/** v2 design → legacy template key kept in sync on save (mirrors the app's mapping). */
export const LEGACY_TEMPLATE_OF: Record<string, "aurora" | "paper" | "noir" | "banner"> = {
  devfolio: "noir",
  studio: "aurora",
  pitch: "paper",
  counter: "banner",
  chalk: "paper",
  care: "paper",
  freight: "banner",
  ledger: "paper",
  host: "aurora",
  spotlight: "noir",
};

const LEGACY_ACCENT: Record<string, string> = {
  aurora: "#5B4BFF",
  paper: "#5B4BFF",
  noir: "#C9A24B",
  banner: "#D97706",
};

const LEGACY_FONT_FAMILY: Record<string, string> = {
  modern: "Manrope",
  serif: "Playfair Display",
  grotesk: "Space Grotesk",
  rounded: "Nunito",
  mono: "JetBrains Mono",
};

export interface ResolvedTheme {
  design: DesignDef;
  accent: string;
  fontFamily: string;
  dark: boolean;
  /** page-level classes */
  page: string;
  soft: string;
  faint: string;
  card: string;
  rule: string;
  chip: string;
}

/** `rgba()` tint of a hex accent. */
export function tintOf(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${alpha})`;
}

export function resolveTheme(site: PublicSite): ResolvedTheme {
  const design =
    (site.design && DESIGNS.find((d) => d.id === site.design!.id)) ||
    DESIGNS.find((d) => d.id === LEGACY_DESIGN[site.template]) ||
    DESIGNS[1];
  const accent = site.design?.accent || LEGACY_ACCENT[site.template] || design.accent;
  const fontFamily = site.design?.fontFamily || LEGACY_FONT_FAMILY[site.font] || "Manrope";
  const dark = !!design.dark;

  return {
    design,
    accent,
    fontFamily,
    dark,
    page: dark ? "bg-[#14161D] text-[#F2F4F8]" : "bg-[#FDFDFC] text-[#16181D]",
    soft: dark ? "text-[#A6ADBB]" : "text-[#5D6470]",
    faint: dark ? "text-[#6F7787]" : "text-[#9AA0AB]",
    card: dark ? "bg-[#1B1F2A] border border-[#2A3040]" : "bg-white border border-[#ECECF2] shadow-[0_2px_16px_rgba(17,24,39,0.04)]",
    rule: dark ? "border-[#2A3040]" : "border-[#ECECF2]",
    chip: dark ? "bg-[var(--pa-soft)] text-[#F2F4F8]" : "bg-[var(--pa-soft)] text-[var(--pa)]",
  };
}
