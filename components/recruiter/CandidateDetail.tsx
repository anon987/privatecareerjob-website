"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRec } from "./Shell";
import { card, Chip, Empty, ProgressTracker, StatusPill, companyInitials } from "@/components/dash/bits";
import { openThread, timeAgo, useJob, type StatusKey } from "@/lib/seeker";
import { updateApplication, updateApplicationStatus, useApplication } from "@/lib/recruiter";

const NEXT_ACTIONS: StatusKey[] = ["Viewed", "Shortlisted", "Interview", "Offer", "Hired", "Rejected"];

/** Candidate detail — resume, skills, screening answers, pipeline moves, private rating + notes. */
export default function CandidateDetail({ appId }: { appId: string }) {
  const router = useRouter();
  const { user, profile } = useRec();
  const { app, loading } = useApplication(appId);
  const { job } = useJob(app?.jobId);
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (app && !notesDirty) setNotes(app.recruiterNotes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.id, app?.recruiterNotes]);

  if (loading) return <div className="h-64 rounded-3xl bg-sunken animate-pulse" />;
  if (!app) {
    return <Empty emoji="🔍" title="Application not found" body="It may have been removed." cta={<Link href="/recruiter/candidates" className="font-bold text-brand">← Back to candidates</Link>} />;
  }

  const rating = app.recruiterRating ?? 0;
  const setRating = (n: number) => updateApplication(app.id, { recruiterRating: n === rating ? 0 : n }).catch(() => {});

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateApplication(app.id, { recruiterNotes: notes.trim() });
      setNotesDirty(false);
    } finally {
      setSavingNotes(false);
    }
  };

  const message = async () => {
    const tid = await openThread({
      seekerUid: app.seekerUid,
      recruiterUid: user.uid,
      seekerName: app.seekerName,
      companyName: profile.companyName ?? "",
      jobTitle: app.jobTitle,
      applicationId: app.id,
    });
    router.push(`/recruiter/messages?t=${tid}`);
  };

  const answerLabel = (v?: string) => (v === "yes" ? "Yes" : v === "no" ? "No" : "Skipped");

  return (
    <div className="max-w-[720px]">
      <Link href="/recruiter/candidates" className="text-[13.5px] font-bold text-brand">← All candidates</Link>

      {/* identity */}
      <div className={`${card} mt-3`}>
        <div className="flex items-start gap-4">
          <span aria-hidden className="grid place-items-center w-14 h-14 rounded-full bg-brand-tonal text-brand text-[18px] font-extrabold shrink-0">
            {companyInitials(app.seekerName)}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-extrabold tracking-[-0.3px]">{app.seekerName}</h1>
            {app.seekerHeadline && <p className="text-[14px] text-ink-2">{app.seekerHeadline}</p>}
            <p className="text-[13px] text-ink-3 mt-1">Applied for {app.jobTitle} · {timeAgo(app.appliedAt)}</p>
          </div>
          <StatusPill status={app.status} />
        </div>
        <ProgressTracker status={app.status} />
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={message} className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition cursor-pointer press">
            💬 Message candidate
          </button>
          {app.resumeUrl && (
            <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-11 px-5 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold text-[14px] transition press">
              📄 {app.resumeName || "Resume"}
            </a>
          )}
        </div>
      </div>

      {/* pipeline actions */}
      <div className={`${card} mt-3`}>
        <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Move candidate to</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {NEXT_ACTIONS.map((s) => {
            const active = app.status === s;
            const danger = s === "Rejected";
            return (
              <button
                key={s}
                onClick={() => updateApplicationStatus(app.id, s).catch(() => {})}
                aria-pressed={active}
                className={`px-4 min-h-10 rounded-full border text-[13px] font-bold transition cursor-pointer press ${
                  active ? "border-brand bg-brand text-white" : danger ? "border-red-200 text-red-500 hover:bg-red-50" : "border-line text-ink-2 hover:bg-sunken"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* skills */}
      {(app.skills?.length ?? 0) > 0 && (
        <div className={`${card} mt-3`}>
          <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {app.skills!.map((s) => (
              <Chip key={s} tone="brand">{s}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* cover letter */}
      {app.coverLetter && (
        <div className={`${card} mt-3`}>
          <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Cover letter</h2>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-2 whitespace-pre-line">{app.coverLetter}</p>
        </div>
      )}

      {/* screening answers */}
      {(job?.questions?.length ?? 0) > 0 && (
        <div className={`${card} mt-3`}>
          <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Screening answers</h2>
          <div className="mt-3 space-y-3">
            {job!.questions!.map((qq) => (
              <div key={qq.id}>
                <p className="text-[13px] text-ink-3">{qq.text}</p>
                <p className="text-[14.5px] font-bold">{answerLabel(app.answers?.[qq.id])}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* internal rating + notes (recruiter-private) */}
      <div className={`${card} mt-3`}>
        <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand">Internal rating</h2>
        <div className="mt-2 flex gap-1" role="group" aria-label="Rate candidate">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`Rate ${n} of 5`} className="w-10 h-10 grid place-items-center text-[22px] cursor-pointer press">
              <span className={n <= rating ? "text-accent" : "text-line"}>★</span>
            </button>
          ))}
        </div>
        <p className="text-[12px] text-ink-3">Only your team sees this — never the candidate.</p>

        <h2 className="text-[13px] font-extrabold tracking-[2px] uppercase text-brand mt-5">Private notes</h2>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
          rows={3}
          placeholder="Interview impressions, salary discussion, follow-ups…"
          className="mt-2 w-full px-4 py-3 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition text-[14px]"
        />
        {notesDirty && (
          <button onClick={saveNotes} disabled={savingNotes} className="mt-2 inline-flex items-center min-h-10 px-5 rounded-full border-[1.5px] border-brand text-brand hover:bg-brand-tonal text-[13px] font-bold transition cursor-pointer press disabled:opacity-50">
            {savingNotes ? "Saving…" : "Save note"}
          </button>
        )}
      </div>
    </div>
  );
}
