"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import {
  BulletList, CopyBlock, ErrorNote, FieldLabel, ResultHeading, RunButton, ScoreRing, TextArea, ToolCard, ToolShell,
  profileToText, useAiTool,
} from "./bits";
import type { JobMatchResult } from "@/app/api/ai/job-match/route";

export default function JobMatch() {
  const { profile } = useDash();
  const [text, setText] = useState(() => profileToText(profile));
  const [jd, setJd] = useState("");
  const { run, loading, error, data } = useAiTool<JobMatchResult>("job-match");

  return (
    <ToolShell icon="🎯" title="AI Job Match Assistant" subtitle="An honest fit check before you apply — plus a ready-to-send note for the recruiter.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() && jd.trim()) run({ profile: text, jobDescription: jd });
          }}
          className="grid gap-4"
        >
          <div>
            <FieldLabel hint="prefilled from your profile — edit freely">Your profile / resume</FieldLabel>
            <TextArea required rows={8} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe your experience, skills and education…" />
          </div>
          <div>
            <FieldLabel>Job description</FieldLabel>
            <TextArea required rows={8} maxLength={8000} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description you're considering…" />
          </div>
          <div>
            <RunButton loading={loading} disabled={!text.trim() || !jd.trim()}>Check my fit</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={data.fitScore} label="Role fit" />
            <p className="text-[14.5px] font-semibold leading-relaxed flex-1">{data.verdict}</p>
          </ToolCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard>
              <ResultHeading>Why you&apos;re a fit</ResultHeading>
              <div className="mt-3">
                {data.reasonsToApply.length ? <BulletList items={data.reasonsToApply} tone="good" /> : <p className="text-[13px] text-ink-3">No strong matches found for this role.</p>}
              </div>
            </ToolCard>
            <ToolCard>
              <ResultHeading>Gaps to be aware of</ResultHeading>
              <div className="mt-3">
                {data.gaps.length ? <BulletList items={data.gaps} tone="bad" /> : <p className="text-[13px] text-ink-3">No major gaps — go for it.</p>}
              </div>
            </ToolCard>
          </div>

          {data.applicationTips.length > 0 && (
            <ToolCard>
              <ResultHeading>How to position your application</ResultHeading>
              <div className="mt-3"><BulletList items={data.applicationTips} /></div>
            </ToolCard>
          )}

          <ToolCard>
            <ResultHeading>Message for the recruiter</ResultHeading>
            <p className="text-[12.5px] text-ink-3 mt-1">Send this with your application or in chat — edit it so it sounds like you.</p>
            <div className="mt-3"><CopyBlock text={data.pitchMessage} /></div>
          </ToolCard>
        </>
      )}
    </ToolShell>
  );
}
