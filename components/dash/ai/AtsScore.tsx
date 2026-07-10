"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import { Chip } from "../bits";
import {
  BulletList, ErrorNote, FieldLabel, ResultHeading, RunButton, ScoreRing, TextArea, ToolCard, ToolShell,
  profileToText, useAiTool,
} from "./bits";
import type { AtsScoreResult } from "@/app/api/ai/ats-score/route";

const STATUS_STYLE: Record<string, string> = {
  pass: "text-green-700 bg-green-50",
  warn: "text-amber-700 bg-amber-50",
  fail: "text-red-600 bg-red-50",
};
const STATUS_MARK: Record<string, string> = { pass: "✓", warn: "!", fail: "✕" };

export default function AtsScore() {
  const { profile } = useDash();
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const { run, loading, error, data } = useAiTool<AtsScoreResult>("ats-score");

  const prefill = profileToText(profile);

  return (
    <ToolShell icon="🤖" title="AI ATS Score Checker" subtitle="See how your resume scores against a real job description before you apply.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (resume.trim() && jd.trim()) run({ resume, jobDescription: jd });
          }}
          className="grid gap-4"
        >
          <div>
            <FieldLabel hint={`${resume.length}/12000`}>Your resume text</FieldLabel>
            <TextArea required rows={8} maxLength={12000} value={resume} onChange={(e) => setResume(e.target.value)} placeholder="Paste your resume text here…" />
            {prefill && !resume && (
              <button type="button" onClick={() => setResume(prefill)} className="mt-2 text-[12.5px] font-extrabold text-brand cursor-pointer">
                Use my profile instead
              </button>
            )}
          </div>
          <div>
            <FieldLabel>Job description</FieldLabel>
            <TextArea required rows={8} maxLength={8000} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description you want to apply for…" />
          </div>
          <div>
            <RunButton loading={loading} disabled={!resume.trim() || !jd.trim()}>Check my ATS score</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={data.score} label="ATS match" />
            <p className="text-[14.5px] font-semibold leading-relaxed flex-1">{data.verdict}</p>
          </ToolCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard>
              <ResultHeading>Keywords you match</ResultHeading>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.matchedKeywords.length ? data.matchedKeywords.map((k) => <Chip key={k} tone="green">{k}</Chip>) : <p className="text-[13px] text-ink-3">No clear matches found.</p>}
              </div>
            </ToolCard>
            <ToolCard>
              <ResultHeading>Keywords you&apos;re missing</ResultHeading>
              <p className="text-[12px] text-ink-3 mt-1">Add the ones that are genuinely true for you.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.missingKeywords.length ? data.missingKeywords.map((k) => <Chip key={k} tone="amber">{k}</Chip>) : <p className="text-[13px] text-ink-3">Nothing important missing — nice.</p>}
              </div>
            </ToolCard>
          </div>

          <ToolCard>
            <ResultHeading>Section checks</ResultHeading>
            <div className="mt-3 grid gap-2">
              {data.sectionChecks.map((c, i) => (
                <div key={i} className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3">
                  <span aria-hidden className={`grid place-items-center w-6 h-6 rounded-full text-[12px] font-extrabold shrink-0 ${STATUS_STYLE[c.status] ?? STATUS_STYLE.warn}`}>
                    {STATUS_MARK[c.status] ?? "!"}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-extrabold">{c.section}</p>
                    <p className="text-[13px] text-ink-2 leading-relaxed">{c.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </ToolCard>

          {data.formattingTips.length > 0 && (
            <ToolCard>
              <ResultHeading>Formatting tips for parse-safe resumes</ResultHeading>
              <div className="mt-3"><BulletList items={data.formattingTips} /></div>
            </ToolCard>
          )}
        </>
      )}
    </ToolShell>
  );
}
