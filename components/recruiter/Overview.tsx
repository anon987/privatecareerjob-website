"use client";

import Link from "next/link";
import { useRec } from "./Shell";
import { card, Empty, Skeletons, StatCard, StatusPill } from "@/components/dash/bits";
import { timeAgo } from "@/lib/seeker";
import { acceptInvite, declineInvite, useEmployerApplications, useMyInvite, useRecruiterJobs } from "@/lib/recruiter";
import { updateMyProfile } from "@/lib/account";

/** Recruiter dashboard — live hiring metrics + recent jobs + pending team invite. */
export default function Overview() {
  const { user, profile, employerId, refresh } = useRec();
  const { jobs, loading: jobsLoading } = useRecruiterJobs(employerId);
  const { apps } = useEmployerApplications(employerId);
  const invite = useMyInvite(user.email);
  const pendingInvite = invite && invite.status === "invited" && invite.companyUid !== user.uid ? invite : null;

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const m = {
    activeJobs: jobs.filter((j) => j.status === "live").length,
    today: apps.filter((a) => (a.appliedAt?.toMillis?.() ?? 0) >= startOfToday).length,
    candidates: apps.length,
    shortlisted: apps.filter((a) => a.status === "Shortlisted").length,
    interviews: apps.filter((a) => a.status === "Interview").length,
  };

  const onAccept = async () => {
    if (!pendingInvite || !user.email) return;
    await acceptInvite(user.email, user.uid, profile.fullName || user.displayName || "");
    await updateMyProfile(user.uid, { companyId: pendingInvite.companyUid, companyName: pendingInvite.companyName, teamRole: pendingInvite.role });
    await refresh();
  };

  const recent = jobs.slice(0, 4);
  const recentApps = apps.slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rise">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">{profile.companyName || "Your company"}</h1>
          <p className="text-ink-2 text-[14px]">Hiring, live.{profile.companyId ? ` You're on the team as ${profile.teamRole ?? "Recruiter"}.` : ""}</p>
        </div>
        <Link href="/recruiter/jobs/new" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition press">
          + Post a job
        </Link>
      </div>

      {pendingInvite && (
        <div className={`${card} rise border-brand/40 flex flex-wrap items-center gap-3`}>
          <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand-tonal text-[18px]">👥</span>
          <p className="flex-1 min-w-[220px] text-[14px] font-semibold">
            {pendingInvite.companyName || "A company"} invited you to join their team as {pendingInvite.role} — you'll share jobs and candidates.
          </p>
          <div className="flex gap-2">
            <button onClick={onAccept} className="inline-flex items-center min-h-10 px-4 rounded-full bg-accent hover:bg-accent-pressed text-ink text-[13px] font-bold transition cursor-pointer press">Accept</button>
            <button onClick={() => user.email && declineInvite(user.email)} className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press">Decline</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 rise-1">
        <StatCard icon="📢" value={m.activeJobs} label="Active jobs" />
        <StatCard icon="🆕" value={m.today} label="Applications today" />
        <StatCard icon="👥" value={m.candidates} label="Candidates" />
        <StatCard icon="⭐" value={m.shortlisted} label="Shortlisted" />
        <StatCard icon="🎤" value={m.interviews} label="Interviews" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <section aria-label="Your jobs">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-extrabold">Your jobs</h2>
            <Link href="/recruiter/jobs" className="text-[13px] font-bold text-brand">All jobs →</Link>
          </div>
          <div className="mt-3 space-y-3">
            {jobsLoading ? (
              <Skeletons n={2} h="h-20" />
            ) : recent.length ? (
              recent.map((j) => (
                <Link key={j.id} href="/recruiter/candidates" className={`${card} card-lift !py-4 flex items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold truncate">{j.title}</h3>
                    <p className="text-[12.5px] text-ink-3 mt-0.5">
                      {[j.location, `${apps.filter((a) => a.jobId === j.id).length} applicants`, timeAgo(j.postedAt)].join(" · ")}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold ${j.status === "live" ? "text-green-600" : "text-ink-3"}`}>
                    <span className={`w-2 h-2 rounded-full ${j.status === "live" ? "bg-green-500" : "bg-ink-3"}`} /> {j.status}
                  </span>
                </Link>
              ))
            ) : (
              <Empty
                emoji="📢"
                title="No jobs yet"
                body="Post your first job — it goes live to seekers instantly."
                cta={<Link href="/recruiter/jobs/new" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent text-ink font-bold text-[14px] press">Post a job</Link>}
              />
            )}
          </div>
        </section>

        <section aria-label="Latest candidates">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-extrabold">Latest candidates</h2>
            <Link href="/recruiter/candidates" className="text-[13px] font-bold text-brand">Pipeline →</Link>
          </div>
          <div className="mt-3 space-y-3">
            {recentApps.length ? (
              recentApps.map((a) => (
                <Link key={a.id} href={`/recruiter/candidates/${a.id}`} className={`${card} card-lift !py-4 flex items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold truncate">{a.seekerName}</h3>
                    <p className="text-[12.5px] text-ink-3 mt-0.5 truncate">{a.jobTitle} · {timeAgo(a.appliedAt)}</p>
                  </div>
                  <StatusPill status={a.status} />
                </Link>
              ))
            ) : (
              <p className="text-[13.5px] text-ink-2">Candidates appear here as people apply to your jobs.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
