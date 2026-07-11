"use client";

import { useEffect, useMemo, useState } from "react";
import { useDash } from "./Shell";
import { Empty, JobCard, Skeletons } from "./bits";
import { useJobScores } from "./ai/useJobScores";
import { isRemote, matchScore, toggleSaveJob, useLiveJobs, useMyApplications, useSavedJobs } from "@/lib/seeker";

const HIDE_KEY = "psj-hidden-jobs";

/** Live job feed — hides applied + hidden jobs; search + quick filters; match scores. */
export default function JobsFeed() {
  const { user, profile } = useDash();
  const { jobs, loading } = useLiveJobs();
  const { apps } = useMyApplications(user.uid);
  const { ids: savedIds } = useSavedJobs(user.uid);
  const aiScores = useJobScores(user.uid, profile, jobs);
  const [q, setQ] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      setHidden(JSON.parse(sessionStorage.getItem(HIDE_KEY) ?? "[]"));
    } catch {}
  }, []);
  const hide = (id: string) => {
    const next = [...hidden, id];
    setHidden(next);
    try {
      sessionStorage.setItem(HIDE_KEY, JSON.stringify(next));
    } catch {}
  };

  const categories = useMemo(() => [...new Set(jobs.map((j) => j.category).filter(Boolean))].sort(), [jobs]);
  const experiences = useMemo(() => [...new Set(jobs.map((j) => j.experienceLevel).filter(Boolean))].sort(), [jobs]);
  const appliedJobIds = useMemo(() => new Set(apps.map((a) => a.jobId)), [apps]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs
      .filter((j) => !appliedJobIds.has(j.id) && !hidden.includes(j.id))
      .filter((j) => !remoteOnly || isRemote(j))
      .filter((j) => !category || j.category === category)
      .filter((j) => !experience || j.experienceLevel === experience)
      .filter(
        (j) =>
          !needle ||
          j.title.toLowerCase().includes(needle) ||
          j.companyName?.toLowerCase().includes(needle) ||
          j.location?.toLowerCase().includes(needle) ||
          j.category?.toLowerCase().includes(needle)
      );
  }, [jobs, appliedJobIds, hidden, q, remoteOnly, category, experience]);

  const select = "min-h-10 px-3.5 rounded-full border border-line bg-white text-[13px] font-bold text-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Jobs</h1>
          <p className="text-ink-2 text-[14px]">Verified openings, live from recruiters.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title, company, city…"
          aria-label="Search jobs"
          className="w-full sm:w-[300px] min-h-11 px-4 rounded-2xl border border-line bg-white outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition"
        />
      </div>

      {/* quick filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
        <button
          onClick={() => setRemoteOnly((v) => !v)}
          aria-pressed={remoteOnly}
          className={`min-h-10 px-4 rounded-full border text-[13px] font-bold transition cursor-pointer press ${
            remoteOnly ? "border-brand bg-brand-tonal text-brand" : "border-line text-ink-2 hover:bg-sunken"
          }`}
        >
          🌍 Remote-friendly
        </button>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={select}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={experience} onChange={(e) => setExperience(e.target.value)} aria-label="Experience" className={select}>
          <option value="">Any experience</option>
          {experiences.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {(remoteOnly || category || experience || q) && (
          <button
            onClick={() => { setRemoteOnly(false); setCategory(""); setExperience(""); setQ(""); }}
            className="min-h-10 px-3 text-[13px] font-bold text-brand cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {loading ? (
          <Skeletons n={4} h="h-56" />
        ) : (
          list.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              score={aiScores[j.id]?.score ?? matchScore(profile.skills, j)}
              scoreReason={aiScores[j.id]?.reason}
              saved={!!savedIds[j.id]}
              onToggleSave={() => toggleSaveJob(user.uid, j, !!savedIds[j.id]).catch(() => {})}
              onHide={() => hide(j.id)}
            />
          ))
        )}
      </div>

      {!loading && list.length === 0 && (
        <Empty
          emoji="🔎"
          title={q || remoteOnly || category || experience ? "No jobs match these filters" : "No live jobs right now"}
          body={q || remoteOnly || category || experience ? "Loosen a filter or clear the search to see more." : "New verified jobs appear here the moment recruiters post them — check back soon."}
        />
      )}
    </div>
  );
}
