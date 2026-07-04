"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRec } from "./Shell";
import { card } from "@/components/dash/bits";
import { useJob, type ScreeningQuestion } from "@/lib/seeker";
import { createJob, updateJob, JOB_CATEGORIES, JOB_TYPES, EXPERIENCE_OPTIONS } from "@/lib/recruiter";

function qid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Post / edit a job — same fields and screening-question model as the app. */
export default function JobForm({ jobId }: { jobId?: string }) {
  const router = useRouter();
  const { user, profile, employerId } = useRec();
  const editing = !!jobId;
  const { job: existing } = useJob(jobId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [experience, setExperience] = useState("Fresher");
  const [jobType, setJobType] = useState("Full-time");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [qText, setQText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const prefilled = useRef(false);

  useEffect(() => {
    if (!editing || !existing || prefilled.current) return;
    prefilled.current = true;
    setTitle(existing.title);
    setCategory(existing.category);
    setLocation(existing.location);
    setSalaryMin(existing.salaryMin != null ? String(existing.salaryMin) : "");
    setSalaryMax(existing.salaryMax != null ? String(existing.salaryMax) : "");
    setExperience(existing.experienceLevel || "Fresher");
    setJobType(existing.jobType || "Full-time");
    setDescription(existing.description || "");
    setQuestions(existing.questions ?? []);
  }, [editing, existing]);

  const addQuestion = () => {
    const text = qText.trim();
    if (!text) return;
    setQuestions((qs) => [...qs, { id: qid(), text, required: true }]);
    setQText("");
  };

  const save = async () => {
    if (!title.trim() || !category || !location.trim()) {
      setError("Title, category and location are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const input = {
        title,
        category,
        location,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        experienceLevel: experience,
        jobType,
        description,
        questions,
      };
      if (editing && jobId) await updateJob(jobId, input);
      else await createJob(employerId ?? user.uid, profile.companyName ?? "", input);
      router.push("/recruiter/jobs");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the job.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition text-[14.5px]";
  const label = "block text-[13px] font-semibold text-ink-2 mb-1.5";

  return (
    <div className="max-w-[680px]">
      <Link href="/recruiter/jobs" className="text-[13.5px] font-bold text-brand">← All jobs</Link>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px] mt-2">{editing ? "Edit job" : "Post a job"}</h1>

      <div className={`${card} mt-4 space-y-4`}>
        <div>
          <label className={label}>Job title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Retail Sales Executive" className={input} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              <option value="">Select category</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Location *</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Patna, Bihar" className={input} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Salary min (₹/mo)</label>
            <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="15000" className={input} />
          </div>
          <div>
            <label className={label}>Salary max (₹/mo)</label>
            <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="22000" className={input} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Experience</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className={input}>
              {EXPERIENCE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Job type</label>
            <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={input}>
              {JOB_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Responsibilities, requirements, benefits…" className={`${input} py-3 min-h-[120px]`} />
        </div>

        {/* screening questions */}
        <div>
          <label className={label}>Screening questions (yes/no)</label>
          <div className="space-y-2">
            {questions.map((qq) => (
              <div key={qq.id} className="flex items-center gap-2.5 bg-sunken rounded-xl px-3.5 py-2.5">
                <p className="flex-1 text-[13.5px] font-semibold">{qq.text}</p>
                <button
                  onClick={() => setQuestions((qs) => qs.map((x) => (x.id === qq.id ? { ...x, required: !x.required } : x)))}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${qq.required ? "bg-brand-tonal text-brand" : "bg-white text-ink-3 border border-line"}`}
                  aria-pressed={qq.required}
                >
                  {qq.required ? "Required" : "Optional"}
                </button>
                <button onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== qq.id))} aria-label="Remove question" className="text-ink-3 hover:text-red-500 cursor-pointer min-w-8 min-h-8">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
              placeholder="e.g. Do you have a two-wheeler with a valid licence?"
              className={input}
            />
            <button onClick={addQuestion} className="shrink-0 inline-flex items-center min-h-12 px-5 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold text-[14px] transition cursor-pointer press">
              Add
            </button>
          </div>
        </div>

        {error && <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div>}

        <button
          onClick={save}
          disabled={busy}
          className="w-full inline-flex items-center justify-center min-h-12 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition disabled:opacity-50 cursor-pointer press"
        >
          {busy ? "Saving…" : editing ? "Save changes" : "Post job — goes live instantly"}
        </button>
      </div>
    </div>
  );
}
