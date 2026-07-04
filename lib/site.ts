/**
 * Server-side access to public profiles via the Firestore REST API.
 * publicProfiles/{handle} is public-read by security rules, so no credentials
 * are needed — pages can be server-rendered for SEO without the Admin SDK.
 */

export const PROJECT_ID = "privatesectorjob";
export const SITE_ORIGIN = "https://privatesectorjob.vercel.app";

export type SiteTemplate = "aurora" | "paper" | "noir" | "banner";
export type SiteFont = "modern" | "serif" | "grotesk" | "rounded" | "mono";

export interface SiteEntry {
  role?: string;
  company?: string;
  degree?: string;
  school?: string;
  name?: string;
  issuer?: string;
  title?: string;
  period?: string;
  year?: string;
  description?: string;
}

/** v2 design choice written by the app (preferred over the legacy template/font keys). */
export interface SiteDesign {
  id: string;
  accent: string;
  font: string;
  /** Google Fonts family name to load for the page */
  fontFamily: string;
}

/** Architecture-ready rich content (rendered when present; editors ship later). */
export interface SiteStat {
  value: string;
  label: string;
}
export interface SiteTestimonial {
  quote: string;
  author: string;
  role?: string;
}
export interface SiteProduct {
  name: string;
  description?: string;
  url?: string;
  playUrl?: string;
  image?: string;
}

export interface PublicSite {
  uid: string;
  handle: string;
  name: string;
  headline: string;
  summary: string;
  location: string;
  role: "seeker" | "recruiter";
  skills: string[];
  languages: string[];
  experience: SiteEntry[];
  education: SiteEntry[];
  certificates: SiteEntry[];
  projects: SiteEntry[];
  photoUri?: string;
  gallery: string[];
  template: SiteTemplate;
  font: SiteFont;
  design?: SiteDesign;
  published: boolean;
  // contact (present only when the owner opted in from the app/editor)
  email?: string;
  phone?: string;
  showEmail?: boolean;
  showPhone?: boolean;
  // search visibility: pages are noindex unless the owner opts in
  noindex?: boolean;
  discoverable?: boolean;
  /** lifetime page views (rules-gated public +1 increment per render) */
  views?: number;
  // architecture-ready extras
  availability?: string;
  resumeUrl?: string;
  stats?: SiteStat[];
  achievements?: string[];
  testimonials?: SiteTestimonial[];
  products?: SiteProduct[];
  socials?: { linkedin?: string; github?: string; website?: string };
}

/* ---- Firestore REST value decoding ---- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FsValue = any;

function decodeValue(v: FsValue): unknown {
  if (v == null || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields ?? {});
  if ("timestampValue" in v) return v.timestampValue;
  return undefined;
}

function decodeFields(fields: Record<string, FsValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

/** Fetch a published public profile; null if missing/unpublished. Cached 60s. */
export async function fetchSite(handle: string): Promise<PublicSite | null> {
  if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(handle)) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/publicProfiles/${handle}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.fields) return null;
  const site = decodeFields(json.fields) as unknown as PublicSite;
  if (!site.published) return null;
  return site;
}

/** Fire-and-forget +1 on the page's view counter (security rules allow exactly this
 *  and nothing else without auth). Never blocks or fails the page render. */
export function bumpViews(handle: string): void {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/publicProfiles/${handle}`;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: { document: docPath, fieldTransforms: [{ fieldPath: "views", increment: { integerValue: "1" } }] },
          currentDocument: { exists: true },
        },
      ],
    }),
  }).catch(() => {});
}

/** Only allow the exact base64 data-URI shape our app writes into image fields. */
export function safeImg(u: unknown): string {
  return typeof u === "string" && /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(u) ? u : "";
}

/* ---- derived, honest metrics & helpers ---- */

/** Years of experience derived from the earliest 4-digit year in experience periods. */
export function yearsOfExperience(site: PublicSite): number | null {
  const years = (site.experience ?? [])
    .flatMap((e) => (e.period?.match(/(19|20)\d{2}/g) ?? []).map(Number))
    .filter((y) => y > 1950 && y <= new Date().getFullYear());
  if (!years.length) return null;
  const span = new Date().getFullYear() - Math.min(...years);
  return span > 0 ? span : null;
}

/** "Hindi (Fluent)" → { name, level } (the app stores proficiency inline). */
export function parseLanguage(s: string): { name: string; level: string } {
  const m = s.match(/^(.*) \((Basic|Intermediate|Fluent|Native)\)$/);
  return m ? { name: m[1], level: m[2] } : { name: s, level: "" };
}

const SKILL_GROUPS: { name: string; match: RegExp }[] = [
  { name: "Languages", match: /^(java(script)?|typescript|kotlin|swift|dart|python|php|c\+\+|c#|go|ruby|rust|sql)$/i },
  { name: "Mobile", match: /(android|ios|react native|expo|flutter|jetpack|compose|swiftui|mobile)/i },
  { name: "Frontend", match: /(react|next\.?js|vue|angular|html|css|tailwind|frontend|web)/i },
  { name: "Backend & APIs", match: /(node|laravel|django|spring|api|backend|rest|graphql|server)/i },
  { name: "Cloud & Data", match: /(firebase|aws|gcp|azure|cloud|firestore|mongo|mysql|postgres|redis|database)/i },
  { name: "Design", match: /(figma|design|ui|ux|photoshop|illustrator|merchandis)/i },
  { name: "Tools & Practices", match: /(git|github|jira|agile|scrum|ci|docker|testing|play store|deployment)/i },
];

/** Group skills into named categories; skills that match nothing land in "Core skills".
 *  Returns a single unnamed group when categorization wouldn't add clarity. */
export function groupSkills(skills: string[]): { name: string; skills: string[] }[] {
  const groups = new Map<string, string[]>();
  const rest: string[] = [];
  for (const s of skills) {
    const g = SKILL_GROUPS.find((x) => x.match.test(s));
    if (g) groups.set(g.name, [...(groups.get(g.name) ?? []), s]);
    else rest.push(s);
  }
  if (groups.size < 2) return [{ name: "", skills }];
  const out = [...groups.entries()].map(([name, sk]) => ({ name, skills: sk }));
  if (rest.length) out.push({ name: "Core skills", skills: rest });
  return out;
}
