"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDash } from "./Shell";
import { card, CompanyBadge, companyInitials, Empty, JobMeta, StatusPill } from "./bits";
import {
  applyToJob,
  openThread,
  toggleSaveJob,
  useJob,
  useMyApplications,
  useSavedJobs,
  type AnswerValue,
} from "@/lib/seeker";

/** Job detail + apply — same screening Q&A flow and application doc as the app. */
export default function JobDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, profile } = useDash();
  const { job, loading } = useJob(id);
  const { apps } = useMyApplications(user.uid);
  const { ids: savedIds } = useSavedJobs(user.uid);

  const myApp = useMemo(() => apps.find((a) => a.jobId === id), [apps, id]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [coverLetter, setCoverLetter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <div className="h-64 rounded-3xl bg-sunken animate-pulse" />;
  if (!job || job.status !== "live") {
    return (
      <Empty
        title="This job is no longer available"
        body="It may have been closed or filled."
        cta={<Link href="/dashboard" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent text-ink font-bold text-[14px]">Browse live jobs</Link>}
      />
    );
  }

  const questions = job.questions ?? [];
  const requiredUnanswered = questions.filter((qq) => qq.required && !answers[qq.id]);
  const defaultResume = (profile.resumes ?? []).find((r) => r.isDefault) ?? (profile.resumes ?? [])[0];

  const apply = async () => {
    if (requiredUnanswered.length) {
      setError("Please answer the required screening questions.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const full: Record<string, AnswerValue> = {};
      for (const qq of questions) full[qq.id] = answers[qq.id] ?? "skipped";
      await applyToJob({
        job,
        seekerUid: user.uid,
        seekerName: profile.fullName || user.displayName || "",
        seekerHeadline: profile.headline ?? "",
        resumeName: defaultResume?.filename ?? "",
        resumeUrl: defaultResume?.url ?? "",
        coverLetter: coverLetter.trim(),
        skills: profile.skills ?? [],
        answers: full,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply — try again.");
    } finally {
      setBusy(false);
    }
  };

  const message = async () => {
    const tid = await openThread({
      seekerUid: user.uid,
      recruiterUid: job.employerId,
      seekerName: profile.fullName || "",
      companyName: job.companyName || "",
      jobTitle: job.title,
      applicationId: myApp?.id,
    });
    router.push(`/dashboard/messages?t=${tid}`);
  };

  return (
    <div className="max-w-[720px]">
      <Link href="/dashboard" className="text-[13.5px] font-bold text-brand">← All jobs</Link>

      <div className={`${card} mt-3`}>
        <CompanyBadge name={job.companyName || "Company"} initials={companyInitials(job.companyName)} />
        <h1 className="text-[22px] font-extrabold tracking-[-0.3px] mt-3">{job.title}</h1>
        <JobMeta job={job} />
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {myApp ? (
            <>
              <StatusPill status={myApp.status} />
              <button onClick={message} className="inline-flex items-center min-h-11 px-5 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold text-[14px] transition cursor-pointer">
                Message recruiter
              </button>
              <Link href="/dashboard/applications" className="text-[13.5px] font-bold text-brand">Track application →</Link>
            </>
          ) : (
            <button
              onClick={() => toggleSaveJob(user.uid, job, !!savedIds[job.id]).catch(() => {})}
              className={`inline-flex items-center min-h-11 px-5 rounded-2xl border font-bold text-[14px] transition cursor-pointer ${
                savedIds[job.id] ? "border-brand bg-brand-tonal text-brand" : "border-line hover:bg-sunken"
              }`}
            >
              {savedIds[job.id] ? "★ Saved" : "☆ Save for later"}
            </button>
          )}
        </div>
      </div>

      {job.description && (
        <div className={`${card} mt-3`}>
          <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">About this job</h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink whitespace-pre-line">{job.description}</p>
        </div>
      )}

      {!myApp && (
        <div className={`${card} mt-3`}>
          <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Apply</h2>

          {questions.length > 0 && (
            <div className="mt-3 space-y-4">
              {questions.map((qq) => (
                <div key={qq.id}>
                  <p className="text-[14.5px] font-semibold">
                    {qq.text} {qq.required && <span className="text-red-500">*</span>}
                  </p>
                  <div className="mt-2 flex gap-2">
                    {(["yes", "no"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setAnswers((a) => ({ ...a, [qq.id]: v }))}
                        className={`px-5 min-h-10 rounded-full border text-[13.5px] font-bold transition cursor-pointer ${
                          answers[qq.id] === v ? "border-brand bg-brand-tonal text-brand" : "border-line hover:bg-sunken"
                        }`}
                      >
                        {v === "yes" ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Cover letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={3}
              placeholder="A short note to the recruiter…"
              className="w-full px-4 py-3 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition text-[14.5px]"
            />
          </div>

          <p className="mt-3 text-[12.5px] text-ink-3">
            Applies with your app profile: {profile.skills?.length ?? 0} skills{defaultResume ? ` · resume "${defaultResume.filename}"` : " · no resume attached (add one in the app)"}.
          </p>

          <button
            onClick={apply}
            disabled={busy}
            className="mt-4 inline-flex items-center min-h-12 px-7 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Applying…" : "Apply now"}
          </button>
          {error && <div className="mt-3 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div>}
        </div>
      )}
    </div>
  );
}
