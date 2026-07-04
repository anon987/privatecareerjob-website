"use client";

import { useState } from "react";
import Link from "next/link";
import { useDash } from "./Shell";
import { card, Empty, MatchBadge, Skeletons } from "./bits";
import { unsaveJob, useSavedJobs, type SavedEntry } from "@/lib/seeker";

function savedAgo(ms?: number): string {
  if (!ms) return "";
  const days = Math.floor((Date.now() - ms) / (24 * 3600 * 1000));
  if (days < 1) return "saved today";
  if (days === 1) return "saved yesterday";
  if (days < 7) return `saved ${days}d ago`;
  return `saved ${Math.floor(days / 7)}w ago`;
}

/** Match score against the saved snapshot (title/category live on the snapshot). */
function snapshotMatch(skills: string[] | undefined, j: SavedEntry): number | null {
  if (!skills?.length) return null;
  const hay = `${j.title} ${j.category}`.toLowerCase();
  const hits = skills.filter((s) => s.length > 1 && hay.includes(s.toLowerCase())).length;
  return hits ? Math.min(98, 55 + Math.round((hits / Math.min(skills.length, 8)) * 43)) : null;
}

/** Saved jobs — synced with the app; supports multi-select bulk remove. */
export default function Saved() {
  const { user, profile } = useDash();
  const { saved, loading } = useSavedJobs(user.uid);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const bulkRemove = async () => {
    await Promise.all([...selected].map((id) => unsaveJob(user.uid, id)));
    setSelected(new Set());
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Saved jobs</h1>
        {selected.size > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] font-semibold text-ink-2">{selected.size} selected</span>
            <button onClick={bulkRemove} className="inline-flex items-center min-h-10 px-4 rounded-full text-red-500 border border-red-200 hover:bg-red-50 text-[13px] font-bold transition cursor-pointer press">
              Remove selected
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Skeletons n={2} h="h-24" />
        ) : (
          saved.map((j) => (
            <div key={j.id} className={`${card} card-lift rise flex flex-wrap items-center gap-3`}>
              <input
                type="checkbox"
                checked={selected.has(j.id)}
                onChange={() => toggle(j.id)}
                aria-label={`Select ${j.title}`}
                className="w-5 h-5 accent-brand shrink-0 cursor-pointer"
              />
              <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand-tonal text-brand text-[13px] font-extrabold shrink-0">
                {j.company.initials}
              </span>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[15.5px] font-bold">{j.title}</h3>
                  <MatchBadge score={snapshotMatch(profile.skills, j)} />
                </div>
                <p className="text-[13px] text-ink-2 mt-0.5">
                  {j.company.name} <span className="text-brand">✓</span>
                  {" · "}
                  {[
                    j.location,
                    j.salaryMin || j.salaryMax ? `₹${j.salaryMin.toLocaleString("en-IN")}–${j.salaryMax.toLocaleString("en-IN")}/mo` : "",
                    savedAgo(j.savedAt),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/jobs/${j.id}`} className="inline-flex items-center min-h-10 px-4 rounded-full bg-accent hover:bg-accent-pressed text-ink text-[13px] font-bold transition press">
                  View & apply
                </Link>
                <button
                  onClick={() => unsaveJob(user.uid, j.id)}
                  className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && saved.length === 0 && (
        <Empty
          emoji="⭐"
          title="Nothing saved yet"
          body="Tap the ☆ on any job to keep it here for later. Saved jobs sync with the app."
          cta={
            <Link href="/dashboard/jobs" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition press">
              Browse jobs
            </Link>
          }
        />
      )}
    </div>
  );
}
