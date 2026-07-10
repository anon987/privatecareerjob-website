"use client";

import { useState } from "react";
import Link from "next/link";
import { useDash } from "../Shell";
import { Chip } from "../bits";
import {
  BulletList, CopyBlock, ErrorNote, FieldLabel, ResultHeading, RunButton, ScoreRing, TextArea, TextInput, ToolCard, ToolShell,
  profileToText, useAiTool,
} from "./bits";
import type { ProfileOptimizerResult } from "@/app/api/ai/profile-optimizer/route";

export default function ProfileOptimizer() {
  const { profile } = useDash();
  const [text, setText] = useState(() => profileToText(profile));
  const [targetRole, setTargetRole] = useState("");
  const { run, loading, error, data } = useAiTool<ProfileOptimizerResult>("profile-optimizer");

  return (
    <ToolShell icon="🧭" title="AI Profile Optimizer" subtitle="Get found by recruiters — sharper headline, stronger summary, and the keywords search runs on.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) run({ profile: text, targetRole });
          }}
          className="grid gap-4"
        >
          <div>
            <FieldLabel hint="prefilled from your profile — edit freely">Your profile</FieldLabel>
            <TextArea required rows={10} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe your role, skills, experience and education…" />
            {!text.trim() && (
              <p className="text-[12.5px] text-ink-3 mt-2">
                Your profile looks empty — <Link href="/dashboard/profile" className="font-bold text-brand">fill it in first</Link> or type a quick description above.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel hint="optional">Role you want to be found for</FieldLabel>
              <TextInput value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={200} placeholder="e.g. Digital Marketing Executive" />
            </div>
          </div>
          <div>
            <RunButton loading={loading} disabled={!text.trim()}>Optimize my profile</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard className="flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing score={data.completeness} label="Profile strength" />
            <div className="flex-1 w-full">
              <ResultHeading>Recommended headline</ResultHeading>
              <div className="mt-2"><CopyBlock text={data.headline} /></div>
              {data.headlineAlternatives.length > 0 && (
                <details className="mt-2 text-[13px]">
                  <summary className="font-bold text-brand cursor-pointer">More headline options</summary>
                  <ul className="mt-2 grid gap-1.5">
                    {data.headlineAlternatives.map((h, i) => <li key={i} className="text-ink-2 leading-relaxed">• {h}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </ToolCard>

          <div className="grid gap-4 md:grid-cols-2">
            <ToolCard>
              <ResultHeading>Profile summary</ResultHeading>
              <div className="mt-3"><CopyBlock text={data.summary} /></div>
            </ToolCard>
            <ToolCard>
              <ResultHeading>LinkedIn “About” version</ResultHeading>
              <div className="mt-3"><CopyBlock text={data.linkedinSummary} /></div>
            </ToolCard>
          </div>

          {data.keywordSuggestions.length > 0 && (
            <ToolCard>
              <ResultHeading>Keywords recruiters search for</ResultHeading>
              <p className="text-[12.5px] text-ink-3 mt-1">Add these to your skills and headline so you show up in recruiter searches.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.keywordSuggestions.map((k) => <Chip key={k} tone="brand">{k}</Chip>)}
              </div>
            </ToolCard>
          )}

          {data.quickWins.length > 0 && (
            <ToolCard>
              <ResultHeading>Quick wins</ResultHeading>
              <div className="mt-3"><BulletList items={data.quickWins} tone="bad" /></div>
              <p className="text-[12.5px] text-ink-3 mt-3">
                Apply these on your <Link href="/dashboard/profile" className="font-bold text-brand">Profile page</Link>.
              </p>
            </ToolCard>
          )}
        </>
      )}
    </ToolShell>
  );
}
