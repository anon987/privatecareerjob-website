"use client";

import Link from "next/link";
import { useRec } from "./Shell";
import { card, Empty, Skeletons } from "@/components/dash/bits";
import { formatSalary, timeAgo } from "@/lib/seeker";
import { deleteJob, setJobStatus, useEmployerApplications, useRecruiterJobs } from "@/lib/recruiter";

/** The company's job posts: edit, close/reopen, delete, view applicants. */
export default function JobsList() {
  const { employerId } = useRec();
  const { jobs, loading } = useRecruiterJobs(employerId);
  const { apps } = useEmployerApplications(employerId);

  const remove = (id: string, title: string) => {
    if (confirm(`Delete "${title}" permanently? Applicants keep their application records.`)) {
      deleteJob(id).catch(() => {});
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Jobs</h1>
        <Link href="/recruiter/jobs/new" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition press">
          + Post a job
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <Skeletons n={3} h="h-28" />
        ) : (
          jobs.map((j) => {
            const applicants = apps.filter((a) => a.jobId === j.id).length;
            const live = j.status === "live";
            return (
              <div key={j.id} className={`${card} card-lift rise`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-[16px] font-bold">{j.title}</h3>
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold ${live ? "text-green-600" : "text-ink-3"}`}>
                        <span className={`w-2 h-2 rounded-full ${live ? "bg-green-500" : "bg-ink-3"}`} /> {j.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-ink-3 mt-1">
                      {[j.location, formatSalary(j.salaryMin, j.salaryMax), j.experienceLevel, timeAgo(j.postedAt)].filter(Boolean).join("  ·  ")}
                    </p>
                    <p className="text-[13px] font-semibold text-brand mt-1.5">{applicants} applicant{applicants === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/recruiter/candidates" className="inline-flex items-center min-h-10 px-4 rounded-full bg-accent hover:bg-accent-pressed text-ink text-[13px] font-bold transition press">
                      Candidates
                    </Link>
                    <Link href={`/recruiter/jobs/${j.id}/edit`} className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition press">
                      Edit
                    </Link>
                    <button
                      onClick={() => setJobStatus(j.id, live ? "closed" : "live").catch(() => {})}
                      className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press"
                    >
                      {live ? "Close" : "Reopen"}
                    </button>
                    <button
                      onClick={() => remove(j.id, j.title)}
                      className="inline-flex items-center min-h-10 px-3.5 rounded-full text-red-500 hover:bg-red-50 text-[13px] font-bold transition cursor-pointer press"
                      aria-label={`Delete ${j.title}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && jobs.length === 0 && (
        <Empty
          emoji="📢"
          title="No jobs posted yet"
          body="Your first post goes live to job seekers instantly — in the app and on the web."
          cta={<Link href="/recruiter/jobs/new" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent text-ink font-bold text-[14px] press">Post a job</Link>}
        />
      )}
    </div>
  );
}
