"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDash } from "./Shell";
import { card, JobCard, StatCard, StatusPill, Skeletons } from "./bits";
import { loadMySite } from "@/lib/account";
import type { PublicSite } from "@/lib/site";
import {
  matchScore,
  timeAgo,
  toggleSaveJob,
  useLiveJobs,
  useMyApplications,
  useSavedJobs,
  useThreads,
  type StatusKey,
} from "@/lib/seeker";

const TERMINAL: StatusKey[] = ["Rejected", "Withdrawn"];

/** The app's 9 profile-completeness checks, mirrored for the web. */
function completeness(p: ReturnType<typeof useDash>["profile"]): { pct: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ["Name", !!p.fullName],
    ["Headline", !!p.headline],
    ["Phone", !!p.phone],
    ["Location", !!p.location],
    ["Skills", (p.skills?.length ?? 0) > 0],
    ["Experience", (p.experience?.length ?? 0) > 0],
    ["Education", (p.education?.length ?? 0) > 0],
    ["Languages", (p.languages?.length ?? 0) > 0],
    ["Projects", (p.projects?.length ?? 0) > 0],
  ];
  const done = checks.filter(([, ok]) => ok).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter(([, ok]) => !ok).map(([l]) => l) };
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Dashboard Home — the command center. Every number is real Firestore data. */
export default function Home() {
  const { user, profile } = useDash();
  const { jobs, loading: jobsLoading } = useLiveJobs();
  const { apps } = useMyApplications(user.uid);
  const { saved, ids: savedIds } = useSavedJobs(user.uid);
  const { threads } = useThreads(user.uid);
  const [site, setSite] = useState<PublicSite | null>(null);

  useEffect(() => {
    if (profile.publicHandle) loadMySite(profile.publicHandle).then(setSite).catch(() => {});
  }, [profile.publicHandle]);

  const { pct, missing } = completeness(profile);
  const active = apps.filter((a) => !TERMINAL.includes(a.status)).length;
  const responded = apps.filter((a) => a.status !== "Applied" && a.status !== "Withdrawn").length;
  const responseRate = apps.length ? `${Math.round((responded / apps.length) * 100)}%` : "—";

  // rule-based next action
  const nextAction = !profile.publicHandle
    ? { text: "Publish your portfolio page — recruiters trust candidates with a live profile.", href: "/dashboard/website", cta: "Set up My page" }
    : pct < 70
    ? { text: `Your profile is ${pct}% complete — filling the gaps makes you visible to more recruiters.`, href: "/dashboard/website", cta: "See what's missing" }
    : apps.length === 0
    ? { text: "You haven't applied anywhere yet — your first application takes under a minute.", href: "/dashboard/jobs", cta: "Browse jobs" }
    : { text: "Momentum matters — a few fresh applications a week keeps responses coming.", href: "/dashboard/jobs", cta: "See new jobs" };

  // recommended: top-3 unapplied by match score
  const appliedIds = useMemo(() => new Set(apps.map((a) => a.jobId)), [apps]);
  const recommended = useMemo(
    () =>
      jobs
        .filter((j) => !appliedIds.has(j.id))
        .map((j) => ({ j, s: matchScore(profile.skills, j) }))
        .sort((a, b) => (b.s ?? 0) - (a.s ?? 0))
        .slice(0, 3),
    [jobs, appliedIds, profile.skills]
  );

  // recent activity: applications + threads interleaved
  const activity = useMemo(() => {
    const items = [
      ...apps.slice(0, 5).map((a) => ({
        at: a.appliedAt?.toMillis?.() ?? 0,
        node: (
          <div key={`a-${a.id}`} className="flex items-center gap-3 py-2.5">
            <span aria-hidden className="grid place-items-center w-9 h-9 rounded-xl bg-brand-tonal text-[16px] shrink-0">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate">{a.jobTitle} · {a.companyName || "Company"}</p>
              <p className="text-[12px] text-ink-3">{timeAgo(a.appliedAt)}</p>
            </div>
            <StatusPill status={a.status} />
          </div>
        ),
      })),
      ...threads.slice(0, 5).map((t) => ({
        at: t.lastMessageAt?.toMillis?.() ?? 0,
        node: (
          <Link key={`t-${t.id}`} href={`/dashboard/messages?t=${t.id}`} className="flex items-center gap-3 py-2.5 hover:bg-sunken rounded-xl px-1 -mx-1 transition">
            <span aria-hidden className="grid place-items-center w-9 h-9 rounded-xl bg-brand-tonal text-[16px] shrink-0">💬</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-semibold truncate">{t.companyName || "Company"}</p>
              <p className="text-[12px] text-ink-2 truncate">{t.lastMessage || t.jobTitle || "Conversation"}</p>
            </div>
            <span className="text-[11.5px] text-ink-3 whitespace-nowrap">{timeAgo(t.lastMessageAt)}</span>
          </Link>
        ),
      })),
    ];
    return items.sort((a, b) => b.at - a.at).slice(0, 5);
  }, [apps, threads]);

  return (
    <div className="space-y-5">
      {/* greeting + next action */}
      <div className="rise">
        <h1 className="text-[26px] font-extrabold tracking-[-0.4px]">
          {greeting()}{profile.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-ink-2 text-[14.5px] mt-0.5">Your career, in one place.</p>
      </div>

      <div className={`${card} rise-1 flex flex-wrap items-center gap-4 !py-4 border-brand/25 bg-[linear-gradient(135deg,rgba(91,75,255,0.05),transparent_60%)]`}>
        <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand text-white text-[18px] shrink-0">→</span>
        <p className="flex-1 min-w-[220px] text-[14.5px] font-semibold">{nextAction.text}</p>
        <Link href={nextAction.href} className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition press">
          {nextAction.cta}
        </Link>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 rise-1">
        <StatCard icon="📄" value={apps.length} label="Applications" hint={`${active} active`} />
        <StatCard icon="⚡" value={responseRate} label="Response rate" />
        <StatCard icon="⭐" value={saved.length} label="Saved jobs" />
        <StatCard icon="💬" value={threads.length} label="Conversations" />
        <StatCard icon="👁️" value={site?.published ? (site.views ?? 0) : "—"} label="Portfolio views" hint={site?.published ? undefined : "publish to start counting"} />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* recommended jobs */}
        <section aria-label="Recommended jobs">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-extrabold">Recommended for you</h2>
            <Link href="/dashboard/jobs" className="text-[13px] font-bold text-brand">All jobs →</Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {jobsLoading ? (
              <Skeletons n={2} h="h-52" />
            ) : (
              recommended.map(({ j, s }) => (
                <JobCard key={j.id} job={j} score={s} saved={!!savedIds[j.id]} onToggleSave={() => toggleSaveJob(user.uid, j, !!savedIds[j.id]).catch(() => {})} />
              ))
            )}
            {!jobsLoading && recommended.length === 0 && (
              <p className="text-[13.5px] text-ink-2 col-span-full">No live jobs right now — new ones appear here the moment they're posted.</p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          {/* profile completion */}
          <section className={`${card} rise-2`} aria-label="Profile completion">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[15px] font-extrabold">Profile strength</h2>
              <span className="text-[15px] font-extrabold text-brand">{pct}%</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-sunken overflow-hidden">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            {missing.length > 0 ? (
              <>
                <p className="text-[12.5px] text-ink-2 mt-3">A complete profile reaches noticeably more recruiters. Missing:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {missing.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full border border-line text-[11.5px] font-semibold text-ink-2">○ {m}</span>
                  ))}
                </div>
                <p className="text-[11.5px] text-ink-3 mt-3">Add these from the privatesectorjob app → Profile tab.</p>
              </>
            ) : (
              <p className="text-[12.5px] text-green-700 font-semibold mt-3">✓ Complete — you're putting your best foot forward.</p>
            )}
          </section>

          {/* recent activity */}
          <section className={`${card} rise-2`} aria-label="Recent activity">
            <h2 className="text-[15px] font-extrabold">Recent activity</h2>
            <div className="mt-1 divide-y divide-line">
              {activity.length ? activity.map((x) => x.node) : <p className="text-[13px] text-ink-2 py-3">Applications and messages will show up here.</p>}
            </div>
          </section>

          {/* AI teaser */}
          <section className={`${card} rise-3`} aria-label="AI career tools">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="text-[18px]">🤖</span>
              <h2 className="text-[15px] font-extrabold">AI career tools</h2>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-sunken text-[10.5px] font-bold text-ink-2">SOON</span>
            </div>
            <p className="text-[13px] text-ink-2 mt-2">Resume review, tailored cover letters, interview practice and more are on the way.</p>
            <Link href="/dashboard/ai" className="inline-block mt-2.5 text-[13px] font-bold text-brand">Preview the tools →</Link>
          </section>
        </div>
      </div>
    </div>
  );
}
