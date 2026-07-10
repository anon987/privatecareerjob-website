"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import { Chip } from "../bits";
import {
  BulletList, ErrorNote, FieldLabel, ResultHeading, RunButton, TextArea, TextInput, ToolCard, ToolShell,
  profileToText, useAiTool,
} from "./bits";
import type { CareerRoadmapResult } from "@/app/api/ai/career-roadmap/route";

export default function CareerRoadmap() {
  const { profile } = useDash();
  const [text, setText] = useState(() => profileToText(profile));
  const [targetRole, setTargetRole] = useState("");
  const { run, loading, error, data } = useAiTool<CareerRoadmapResult>("career-roadmap");

  return (
    <ToolShell icon="🗺️" title="AI Career Roadmap" subtitle="Where you are → where you want to be: skill gaps, milestones, and an honest timeline.">
      <ToolCard>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim() && targetRole.trim()) run({ profile: text, targetRole });
          }}
          className="grid gap-4"
        >
          <div>
            <FieldLabel hint="prefilled from your profile — edit freely">Where you are today</FieldLabel>
            <TextArea required rows={8} maxLength={12000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your current role, skills, experience and education…" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Role you want next</FieldLabel>
              <TextInput required value={targetRole} onChange={(e) => setTargetRole(e.target.value)} maxLength={200} placeholder="e.g. HR Manager, Data Analyst" />
            </div>
          </div>
          <div>
            <RunButton loading={loading} disabled={!text.trim() || !targetRole.trim()}>Build my roadmap</RunButton>
          </div>
        </form>
      </ToolCard>

      <ErrorNote error={error} />

      {data && (
        <>
          <ToolCard>
            <ResultHeading>How realistic is this move?</ResultHeading>
            <p className="text-[14px] font-semibold leading-relaxed mt-2">{data.feasibility}</p>
            {data.skillsYouHave.length > 0 && (
              <>
                <p className="text-[12.5px] font-extrabold text-ink-3 uppercase tracking-wide mt-4">Skills that already transfer</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {data.skillsYouHave.map((s) => <Chip key={s} tone="green">{s}</Chip>)}
                </div>
              </>
            )}
          </ToolCard>

          {data.skillsToLearn.length > 0 && (
            <ToolCard>
              <ResultHeading>Skills to build — in priority order</ResultHeading>
              <div className="mt-3 grid gap-3">
                {data.skillsToLearn.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid place-items-center w-6 h-6 rounded-full bg-brand-tonal text-brand text-[12px] font-extrabold shrink-0">{i + 1}</span>
                      <p className="text-[14px] font-extrabold">{s.skill}</p>
                    </div>
                    <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">{s.why}</p>
                    <p className="text-[13px] mt-1.5 leading-relaxed"><span className="font-bold text-brand">How:</span> {s.how}</p>
                  </div>
                ))}
              </div>
            </ToolCard>
          )}

          {data.milestones.length > 0 && (
            <ToolCard>
              <ResultHeading>Your plan</ResultHeading>
              <div className="mt-4 grid gap-0">
                {data.milestones.map((m, i) => (
                  <div key={i} className="relative pl-8 pb-6 last:pb-0">
                    {i < data.milestones.length - 1 && <span aria-hidden className="absolute left-[11px] top-6 bottom-0 w-px bg-line" />}
                    <span aria-hidden className="absolute left-0 top-0.5 grid place-items-center w-6 h-6 rounded-full bg-brand text-white text-[11px] font-extrabold">{i + 1}</span>
                    <p className="text-[11.5px] font-extrabold text-brand uppercase tracking-wide">{m.period}</p>
                    <p className="text-[14.5px] font-extrabold mt-0.5">{m.title}</p>
                    <ul className="mt-2 grid gap-1.5">
                      {m.actions.map((a, j) => (
                        <li key={j} className="text-[13px] text-ink-2 leading-relaxed flex items-start gap-2">
                          <span aria-hidden className="text-brand mt-0.5">•</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ToolCard>
          )}

          {data.watchOuts.length > 0 && (
            <ToolCard>
              <ResultHeading>Watch out for</ResultHeading>
              <div className="mt-3"><BulletList items={data.watchOuts} tone="bad" /></div>
            </ToolCard>
          )}
        </>
      )}
    </ToolShell>
  );
}
