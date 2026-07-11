"use client";

import { useState } from "react";
import Link from "next/link";
import { formatSalary, isRemote, statusStyle, timeAgo, PIPELINE, type JobDoc, type StatusKey } from "@/lib/seeker";

export const card = "bg-white border border-line rounded-3xl p-5 shadow-[0_2px_14px_rgba(17,24,39,0.04)]";
export const cardLift = `${card} card-lift`;

/* ---------------- atoms ---------------- */

export function StatusPill({ status }: { status: StatusKey }) {
  const c = statusStyle(status);
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-bold" style={{ color: c.fg, background: c.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.fg }} />
      {status}
    </span>
  );
}

export function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "brand" | "green" | "amber" }) {
  const cls =
    tone === "brand"
      ? "bg-brand-tonal text-brand"
      : tone === "green"
      ? "bg-green-50 text-green-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-sunken text-ink-2";
  return <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold ${cls}`}>{children}</span>;
}

/** Match badge — only rendered when a real score exists. AI-scored badges
 *  (reason present) get a sparkle and show the reason on hover. */
export function MatchBadge({ score, reason }: { score: number | null; reason?: string }) {
  if (score == null) return null;
  const tone = score >= 85 ? "bg-green-50 text-green-700" : score >= 70 ? "bg-brand-tonal text-brand" : "bg-sunken text-ink-2";
  return (
    <span title={reason} className={`px-2.5 py-1 rounded-full text-[11.5px] font-extrabold ${tone}`}>
      {reason ? "✨ " : ""}{score}% match
    </span>
  );
}

export function StatCard({ icon, value, label, hint }: { icon: string; value: string | number; label: string; hint?: string }) {
  return (
    <div className={`${card} !p-4 flex items-center gap-3`}>
      <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand-tonal text-[18px] shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[20px] font-extrabold leading-tight text-ink">{value}</div>
        <div className="text-[12px] font-semibold text-ink-2 truncate">{label}</div>
        {hint && <div className="text-[11px] text-ink-3">{hint}</div>}
      </div>
    </div>
  );
}

export function CompanyBadge({ name, initials }: { name: string; initials: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-tonal text-brand text-[13px] font-extrabold shrink-0">{initials}</span>
      <span className="text-[13.5px] font-semibold text-ink-2 truncate">
        {name} <span className="text-brand" title="Verified employer">✓</span>
      </span>
    </div>
  );
}

export function companyInitials(name: string): string {
  const parts = (name || "CO").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CO";
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? "")).toUpperCase();
}

export function JobMeta({ job }: { job: JobDoc }) {
  const bits = [job.location, formatSalary(job.salaryMin, job.salaryMax), job.experienceLevel, job.jobType, timeAgo(job.postedAt)].filter(Boolean);
  return <p className="text-[13px] text-ink-3 mt-1.5">{bits.join("  ·  ")}</p>;
}

/** 6-stage visual pipeline tracker (Applied → Hired); terminal states shown distinctly. */
export function ProgressTracker({ status }: { status: StatusKey }) {
  const terminal = status === "Rejected" || status === "Withdrawn";
  const idx = terminal ? -1 : PIPELINE.indexOf(status);
  const c = statusStyle(status);
  return (
    <div aria-label={`Stage: ${status}`} className="mt-3">
      <div className="flex items-center gap-1">
        {PIPELINE.map((s, i) => (
          <div
            key={s}
            title={s}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: terminal ? "#F3F4F6" : i <= idx ? c.fg : "#EEEEF4" }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-ink-3">
        <span>Applied</span>
        <span>{terminal ? <span style={{ color: c.fg }}>{status}</span> : "Hired"}</span>
      </div>
    </div>
  );
}

/* ---------------- job card ---------------- */

export function JobCard({
  job,
  saved,
  onToggleSave,
  applied,
  score,
  scoreReason,
  onHide,
}: {
  job: JobDoc;
  saved: boolean;
  onToggleSave: () => void;
  applied?: boolean;
  score?: number | null;
  /** present when the score came from the AI matcher — shown on hover */
  scoreReason?: string;
  onHide?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const url = `https://privatesectorjob.vercel.app/dashboard/jobs/${job.id}`;

  const share = async () => {
    const text = `${job.title} at ${job.companyName} — ${url}`;
    if (navigator.share) await navigator.share({ title: job.title, text, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <article className={`${cardLift} rise flex flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <CompanyBadge name={job.companyName || "Company"} initials={companyInitials(job.companyName)} />
        <div className="flex items-center gap-1.5 shrink-0">
          <MatchBadge score={score ?? null} reason={scoreReason} />
          <button
            onClick={onToggleSave}
            aria-label={saved ? "Unsave job" : "Save job"}
            aria-pressed={saved}
            className={`w-10 h-10 rounded-full grid place-items-center border transition cursor-pointer focus-visible:ring-2 focus-visible:ring-brand ${
              saved ? "bg-brand-tonal border-brand text-brand" : "border-line text-ink-3 hover:text-brand"
            }`}
          >
            {saved ? "★" : "☆"}
          </button>
        </div>
      </div>

      <h3 className="text-[17px] font-extrabold tracking-[-0.2px] mt-3">{job.title}</h3>
      {salary && <p className="text-[15px] font-bold text-ink mt-1">{salary}</p>}
      <p className="text-[13px] text-ink-3 mt-1">
        {[job.location, job.experienceLevel, timeAgo(job.postedAt)].filter(Boolean).join("  ·  ")}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {isRemote(job) && <Chip tone="green">Remote-friendly</Chip>}
        {job.jobType && <Chip tone="brand">{job.jobType}</Chip>}
        {job.category && <Chip>{job.category}</Chip>}
      </div>

      <div className="mt-4 pt-1 flex items-center gap-2 flex-wrap mt-auto">
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition-colors press"
        >
          {applied ? "View" : "View & apply"}
        </Link>
        <button onClick={share} aria-label="Share job" className="inline-flex items-center min-h-11 px-4 rounded-2xl border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press">
          {copied ? "Copied ✓" : "Share"}
        </button>
        {onHide && (
          <button onClick={onHide} aria-label="Hide job" className="inline-flex items-center min-h-11 px-3.5 rounded-2xl text-ink-3 hover:text-ink text-[13px] font-bold transition cursor-pointer">
            Hide
          </button>
        )}
        {applied && <StatusPill status="Applied" />}
      </div>
    </article>
  );
}

/* ---------------- states ---------------- */

export function Empty({ title, body, cta, emoji = "✨" }: { title: string; body: string; cta?: React.ReactNode; emoji?: string }) {
  return (
    <div className="text-center py-14 rise">
      <div aria-hidden className="mx-auto w-16 h-16 rounded-full bg-brand-tonal grid place-items-center text-[28px]">{emoji}</div>
      <p className="text-[17px] font-bold mt-4">{title}</p>
      <p className="text-ink-2 text-[14px] mt-1.5 max-w-[400px] mx-auto">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}

export function Skeletons({ n = 3, h = "h-24" }: { n?: number; h?: string }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${h} rounded-3xl bg-sunken animate-pulse`} />
      ))}
    </>
  );
}
