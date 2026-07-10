"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import { Chip } from "../bits";
import {
  BulletList, CopyBlock, ErrorNote, FieldLabel, ResultHeading, RunButton, ScoreRing, TextArea, TextInput, ToolCard, ToolShell,
  profileToText, useAiTool,
} from "./bits";
import type { ResumeOptimizerResult } from "@/app/api/ai/resume-optimizer/route";

export default function ResumeOptimizer() {
  const { profile } = useDash();
  const [resume, setResume] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jd, setJd] = useState("");
  const { run, loading, error, data } = useAiTool<ResumeOptimizerResult>("resume-optimizer");

  const prefill = profileToText(profile);

  return (
    <ToolShell icon="🔍" title="AI Resume Optimizer" subtitle="Feedback, rewrites, headline and summary — tuned for how Indian recruiters actually search.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (resume.trim()) run({ resume, targetRole, jobDescription: jd });
          }}
          className="grid gap-4"
        >
          <div>
            <FieldLabel hint={`${resume.length}/12000`}>Your resume text</FieldLabel>
            <TextArea
              required
              rows={10}
              maxLength={12000}
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text here…"
            />
            {prefill && !resume && (
              <button type="button" onClick={() => setResume(prefill)} className="mt-2 text-[12.5px] font-extrabold text-brand cursor-pointer">
                Use my profile instead
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel hint="optional">Target role</FieldLabel>
              <TextInput value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={200} placeholder="e.g. Business Development Manager" />
            </div>
          </div>
          <div>
            <FieldLabel hint="optional — tailors keywords to the job">Job description</FieldLabel>
            <TextArea rows={5} maxLength={8000} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste a job description to tailor your resume against…" />
          </div>
          <div>
            <RunButton loading={loading} disabled={!resume.trim()}>Optimize my resume</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={data.score} label="Resume strength" />
            <div className="grid gap-3 flex-1 w-full">
              <div>
                <ResultHeading>Suggested headline</ResultHeading>
                <div className="mt-2"><CopyBlock text={data.headline} /></div>
              </div>
            </div>
          </ToolCard>

          <ToolCard>
            <ResultHeading>Professional summary</ResultHeading>
            <div className="mt-3"><CopyBlock text={data.summary} /></div>
          </ToolCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard>
              <ResultHeading>What&apos;s working</ResultHeading>
              <div className="mt-3"><BulletList items={data.strengths} tone="good" /></div>
            </ToolCard>
            <ToolCard>
              <ResultHeading>Fix these first</ResultHeading>
              <div className="mt-3"><BulletList items={data.improvements} tone="bad" /></div>
            </ToolCard>
          </div>

          {data.rewrites.length > 0 && (
            <ToolCard>
              <ResultHeading>Line-by-line rewrites</ResultHeading>
              <div className="mt-3 grid gap-3">
                {data.rewrites.map((r, i) => (
                  <div key={i} className="rounded-2xl border border-line p-4">
                    <p className="text-[13px] text-ink-3 line-through leading-relaxed">{r.original}</p>
                    <p className="text-[13.5px] font-semibold mt-1.5 leading-relaxed">{r.improved}</p>
                    <p className="text-[12px] text-brand font-bold mt-1.5">{r.reason}</p>
                  </div>
                ))}
              </div>
            </ToolCard>
          )}

          {data.keywords.length > 0 && (
            <ToolCard>
              <ResultHeading>Add these keywords</ResultHeading>
              <p className="text-[12.5px] text-ink-3 mt-1">Recruiters search by keywords — work these into your resume where they are true for you.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.keywords.map((k) => <Chip key={k} tone="brand">{k}</Chip>)}
              </div>
            </ToolCard>
          )}
        </>
      )}
    </ToolShell>
  );
}
