"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDash } from "./Shell";
import { card, Empty, ProgressTracker, Skeletons, StatCard, StatusPill, companyInitials } from "./bits";
import { openThread, timeAgo, useMyApplications, PIPELINE, type StatusKey } from "@/lib/seeker";

type Filter = "All" | StatusKey;
const FILTERS: Filter[] = ["All", ...PIPELINE, "Rejected"];
const TERMINAL: StatusKey[] = ["Rejected", "Withdrawn"];

/** Applications — momentum KPIs + per-application visual pipeline tracker. */
export default function Applications() {
  const router = useRouter();
  const { user, profile } = useDash();
  const { apps, loading } = useMyApplications(user.uid);
  const [filter, setFilter] = useState<Filter>("All");

  const m = useMemo(() => {
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 3600 * 1000;
    const active = apps.filter((a) => !TERMINAL.includes(a.status)).length;
    const thisMonth = apps.filter((a) => (a.appliedAt?.toMillis?.() ?? 0) >= monthAgo).length;
    const responded = apps.filter((a) => a.status !== "Applied" && a.status !== "Withdrawn").length;
    const interviews = apps.filter((a) => ["Interview", "Offer", "Hired"].includes(a.status)).length;
    const offers = apps.filter((a) => ["Offer", "Hired"].includes(a.status)).length;
    const pc = (n: number) => (apps.length ? `${Math.round((n / apps.length) * 100)}%` : "—");
    return { active, thisMonth, responseRate: pc(responded), interviewRate: pc(interviews), offerRate: pc(offers) };
  }, [apps]);

  const list = filter === "All" ? apps : apps.filter((a) => a.status === filter);
  const countFor = (f: Filter) => (f === "All" ? apps.length : apps.filter((a) => a.status === f).length);

  const message = async (employerId: string, companyName?: string, jobTitle?: string, appId?: string) => {
    const tid = await openThread({
      seekerUid: user.uid,
      recruiterUid: employerId,
      seekerName: profile.fullName || "",
      companyName: companyName || "",
      jobTitle,
      applicationId: appId,
    });
    router.push(`/dashboard/messages?t=${tid}`);
  };

  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Applications</h1>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon="📄" value={m.active} label="Active" />
        <StatCard icon="🗓️" value={m.thisMonth} label="This month" />
        <StatCard icon="⚡" value={m.responseRate} label="Response rate" />
        <StatCard icon="🎤" value={m.interviewRate} label="Interview rate" />
        <StatCard icon="🏆" value={m.offerRate} label="Offer rate" />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-4 min-h-10 rounded-full border text-[13px] font-bold whitespace-nowrap transition cursor-pointer press ${
              filter === f ? "border-brand bg-brand-tonal text-brand" : "border-line text-ink-2 hover:bg-sunken"
            }`}
          >
            {f} <span className="opacity-60">{countFor(f)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {loading ? (
          <Skeletons n={4} h="h-36" />
        ) : (
          list.map((a) => (
            <div key={a.id} className={`${card} card-lift rise`}>
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand-tonal text-brand text-[13px] font-extrabold shrink-0">
                  {companyInitials(a.companyName || "Company")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15.5px] font-bold truncate">{a.jobTitle}</h3>
                  <p className="text-[13px] text-ink-2 mt-0.5 truncate">
                    {a.companyName || "Company"} · applied {timeAgo(a.appliedAt)}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </div>

              <ProgressTracker status={a.status} />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => message(a.employerId, a.companyName, a.jobTitle, a.id)}
                  className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press"
                >
                  💬 Message
                </button>
                <Link href={`/dashboard/jobs/${a.jobId}`} className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition press">
                  View job
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && list.length === 0 && (
        <Empty
          emoji="📄"
          title={filter === "All" ? "No applications yet" : `Nothing in ${filter}`}
          body={filter === "All" ? "Apply to your first verified job — every status change shows up here, live." : "Statuses update here the moment recruiters move you through their pipeline."}
          cta={
            filter === "All" ? (
              <Link href="/dashboard/jobs" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition press">
                Browse jobs
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
