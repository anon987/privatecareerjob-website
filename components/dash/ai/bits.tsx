"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import { card } from "../bits";
import { AiError, callAiTool } from "@/lib/ai/client";
import type { AppProfile } from "@/lib/account";

/* ---------------- data helpers ---------------- */

/** Flatten the signed-in profile into plain text the tools can prefill with. */
export function profileToText(p: AppProfile): string {
  const lines: string[] = [];
  if (p.fullName) lines.push(p.fullName);
  if (p.headline) lines.push(p.headline);
  if (p.location) lines.push(`Location: ${p.location}`);
  if (p.summary) lines.push(`\nSummary:\n${p.summary}`);
  if (p.skills?.length) lines.push(`\nSkills: ${p.skills.join(", ")}`);
  if (p.experience?.length) {
    lines.push("\nExperience:");
    p.experience.forEach((e) => lines.push(`- ${e.role} at ${e.company}${e.period ? ` (${e.period})` : ""}${e.description ? ` — ${e.description}` : ""}`));
  }
  if (p.education?.length) {
    lines.push("\nEducation:");
    p.education.forEach((e) => lines.push(`- ${e.degree}, ${e.school}${e.year ? ` (${e.year})` : ""}`));
  }
  if (p.certificates?.length) {
    lines.push("\nCertificates:");
    p.certificates.forEach((c) => lines.push(`- ${c.name}${c.issuer ? `, ${c.issuer}` : ""}${c.year ? ` (${c.year})` : ""}`));
  }
  if (p.projects?.length) {
    lines.push("\nProjects:");
    p.projects.forEach((x) => lines.push(`- ${x.title}${x.description ? ` — ${x.description}` : ""}`));
  }
  if (p.languages?.length) lines.push(`\nLanguages: ${p.languages.join(", ")}`);
  return lines.join("\n").trim();
}

/** Loading/error/data state around one AI tool endpoint. */
export function useAiTool<T>(tool: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = async (body: unknown) => {
    setLoading(true);
    setError(null);
    try {
      setData(await callAiTool<T>(tool, body));
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError("Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error, data, reset: () => setData(null) };
}

/* ---------------- layout ---------------- */

export function ToolShell({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <Link href="/dashboard/ai" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-2 hover:text-brand transition">
        <ArrowLeft className="h-4 w-4" /> All AI tools
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <span aria-hidden className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-tonal text-[20px] shrink-0">{icon}</span>
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px]">{title}</h1>
          <p className="text-ink-2 text-[13.5px]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4">{children}</div>
    </div>
  );
}

export function ToolCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`${card} rise ${className}`}>{children}</section>;
}

/* ---------------- inputs ---------------- */

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-1.5">
      <span className="text-[13px] font-extrabold text-ink">{children}</span>
      {hint && <span className="text-[11.5px] text-ink-3">{hint}</span>}
    </div>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-line bg-white px-4 py-3 text-[13.5px] leading-relaxed outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 ${props.className ?? ""}`}
    />
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full min-h-11 rounded-2xl border border-line bg-white px-4 text-[13.5px] outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 ${props.className ?? ""}`}
    />
  );
}

export function RunButton({ loading, children, disabled, onClick }: { loading: boolean; children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-2xl bg-brand hover:bg-brand-pressed text-white font-bold text-[14px] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed press"
    >
      {loading ? <LoaderCircle className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
      {loading ? "Working…" : children}
    </button>
  );
}

export function ErrorNote({ error }: { error: AiError | null }) {
  if (!error) return null;
  if (error.setup) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-[13.5px] font-medium">
        ⏳ {error.message}
      </div>
    );
  }
  return <div className="rounded-2xl bg-red-50 border border-red-100 text-red-600 px-4 py-3 text-[13.5px] font-medium">{error.message}</div>;
}

/* ---------------- results ---------------- */

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const color = clamped >= 75 ? "#16A34A" : clamped >= 50 ? "#CA8A04" : "#DC2626";
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label={`${label}: ${clamped} out of 100`}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#EEEEF4" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * clamped) / 100} transform="rotate(-90 55 55)"
        />
        <text x="55" y="61" textAnchor="middle" fontSize="24" fontWeight="800" fill={color}>{clamped}</text>
      </svg>
      <span className="text-[12px] font-bold text-ink-2">{label}</span>
    </div>
  );
}

export function BulletList({ items, tone = "neutral" }: { items: string[]; tone?: "good" | "bad" | "neutral" }) {
  const mark = tone === "good" ? "✓" : tone === "bad" ? "!" : "•";
  const markCls = tone === "good" ? "text-green-600 bg-green-50" : tone === "bad" ? "text-amber-700 bg-amber-50" : "text-brand bg-brand-tonal";
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink">
          <span aria-hidden className={`grid place-items-center w-5 h-5 rounded-full text-[11px] font-extrabold shrink-0 mt-0.5 ${markCls}`}>{mark}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function ResultHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-extrabold tracking-[-0.2px]">{children}</h2>;
}

export function CopyBlock({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl bg-sunken p-4">
      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{text}</p>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-3 text-[12.5px] font-extrabold text-brand cursor-pointer"
      >
        {copied ? "Copied ✓" : label}
      </button>
    </div>
  );
}
