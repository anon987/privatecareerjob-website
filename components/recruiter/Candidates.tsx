"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRec } from "./Shell";
import { card, Chip, Empty, Skeletons, StatusPill, companyInitials } from "@/components/dash/bits";
import { openThread, timeAgo, PIPELINE, type ApplicationDoc, type StatusKey } from "@/lib/seeker";
import { updateApplicationStatus, useEmployerApplications } from "@/lib/recruiter";

type Filter = "All" | StatusKey;
const FILTERS: Filter[] = ["All", ...PIPELINE, "Rejected"];

/** Candidate pipeline — status filters + inline quick actions, like the app. */
export default function Candidates() {
  const router = useRouter();
  const { user, profile, employerId } = useRec();
  const { apps, loading } = useEmployerApplications(employerId);
  const [filter, setFilter] = useState<Filter>("All");

  const list = filter === "All" ? apps : apps.filter((a) => a.status === filter);
  const countFor = (f: Filter) => (f === "All" ? apps.length : apps.filter((a) => a.status === f).length);

  const message = async (a: ApplicationDoc) => {
    const tid = await openThread({
      seekerUid: a.seekerUid,
      recruiterUid: user.uid,
      seekerName: a.seekerName,
      companyName: profile.companyName ?? "",
      jobTitle: a.jobTitle,
      applicationId: a.id,
    });
    router.push(`/recruiter/messages?t=${tid}`);
  };

  const reject = (a: ApplicationDoc) => {
    if (confirm(`Reject ${a.seekerName}? They'll see the application as rejected.`)) {
      updateApplicationStatus(a.id, "Rejected").catch(() => {});
    }
  };

  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Candidates</h1>
      {apps.length > 0 && <p className="text-ink-2 text-[14px] mt-0.5">{apps.length} applicant{apps.length === 1 ? "" : "s"} across your jobs</p>}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by stage">
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
          <Skeletons n={4} h="h-40" />
        ) : (
          list.map((a) => (
            <div key={a.id} className={`${card} card-lift rise`}>
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid place-items-center w-11 h-11 rounded-full bg-brand-tonal text-brand text-[14px] font-extrabold shrink-0">
                  {companyInitials(a.seekerName)}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15.5px] font-bold truncate">{a.seekerName}</h3>
                  <p className="text-[13px] text-ink-2 truncate">{a.seekerHeadline || "Job seeker"}</p>
                  <p className="text-[12.5px] text-ink-3 mt-0.5 truncate">
                    {a.jobTitle} · {timeAgo(a.appliedAt)}
                  </p>
                </div>
                <StatusPill status={a.status} />
              </div>

              {(a.skills?.length ?? 0) > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {a.skills!.slice(0, 4).map((s) => (
                    <Chip key={s} tone="brand">{s}</Chip>
                  ))}
                  {a.skills!.length > 4 && <Chip>+{a.skills!.length - 4}</Chip>}
                </div>
              )}

              <div className="mt-3.5 flex flex-wrap gap-2">
                <Link href={`/recruiter/candidates/${a.id}`} className="inline-flex items-center min-h-10 px-4 rounded-full bg-accent hover:bg-accent-pressed text-ink text-[13px] font-bold transition press">
                  View
                </Link>
                {a.status !== "Shortlisted" && (
                  <button
                    onClick={() => updateApplicationStatus(a.id, "Shortlisted").catch(() => {})}
                    className="inline-flex items-center min-h-10 px-4 rounded-full border-[1.5px] border-brand text-brand hover:bg-brand-tonal text-[13px] font-bold transition cursor-pointer press"
                  >
                    ⭐ Shortlist
                  </button>
                )}
                <button onClick={() => message(a)} className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press">
                  💬 Message
                </button>
                {a.resumeUrl && (
                  <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition press">
                    Resume
                  </a>
                )}
                {a.status !== "Rejected" && (
                  <button onClick={() => reject(a)} className="inline-flex items-center min-h-10 px-3.5 rounded-full text-red-500 hover:bg-red-50 text-[13px] font-bold transition cursor-pointer press">
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && list.length === 0 && (
        <Empty
          emoji="👥"
          title={filter === "All" ? "No candidates yet" : `No candidates in ${filter}`}
          body={filter === "All" ? "Candidates appear here the moment someone applies to your jobs." : "Move candidates through the pipeline from their profile."}
          cta={
            filter === "All" ? (
              <Link href="/recruiter/jobs/new" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent text-ink font-bold text-[14px] press">Post a job</Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
