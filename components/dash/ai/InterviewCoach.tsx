"use client";

import { useState } from "react";
import { useDash } from "../Shell";
import {
  ErrorNote, FieldLabel, ResultHeading, RunButton, TextArea, TextInput, ToolCard, ToolShell, useAiTool,
} from "./bits";
import type { InterviewResult, InterviewRound } from "@/app/api/ai/interview/route";

const ROUNDS: { id: InterviewRound; label: string; blurb: string }[] = [
  { id: "hr", label: "HR round", blurb: "Salary, notice period, strengths — the classic screening call." },
  { id: "technical", label: "Technical round", blurb: "Role-specific scenarios and problem-solving." },
  { id: "communication", label: "English practice", blurb: "Build fluency and confidence for interviews." },
];

interface Turn {
  question: string;
  answer: string;
  feedback?: InterviewResult["feedback"];
}

export default function InterviewCoach() {
  const { profile } = useDash();
  const [role, setRole] = useState(profile.headline ?? "");
  const [round, setRound] = useState<InterviewRound>("hr");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [summary, setSummary] = useState("");
  const [started, setStarted] = useState(false);
  const { run, loading, error, data, reset } = useAiTool<InterviewResult>("interview");

  // Merge each API result into local transcript state.
  const apply = (res: InterviewResult, answered?: { question: string; answer: string }) => {
    if (answered) setTurns((t) => [...t, { ...answered, feedback: res.feedback }]);
    setPendingQuestion(res.finished ? "" : res.nextQuestion);
    if (res.finished) setSummary(res.summary);
  };

  const start = async () => {
    setStarted(true);
    setTurns([]);
    setSummary("");
    await run({ role, round, history: [] });
  };

  // data changes only via run(); apply it exactly once per response
  const [lastApplied, setLastApplied] = useState<InterviewResult | null>(null);
  if (data && data !== lastApplied) {
    setLastApplied(data);
    if (!started) setStarted(true);
    const answered = pendingQuestion && answer ? { question: pendingQuestion, answer } : undefined;
    apply(data, answered);
    setAnswer("");
  }

  const submitAnswer = async (finish = false) => {
    const history = [...turns.map((t) => ({ question: t.question, answer: t.answer }))];
    if (pendingQuestion && answer.trim()) history.push({ question: pendingQuestion, answer });
    await run({ role, round, history, finish });
  };

  const restart = () => {
    setStarted(false);
    setTurns([]);
    setPendingQuestion("");
    setAnswer("");
    setSummary("");
    setLastApplied(null);
    reset();
  };

  return (
    <ToolShell icon="🎤" title="AI Interview Coach" subtitle="Practise a realistic interview and get honest, encouraging feedback on every answer.">
      {!started && (
        <ToolCard>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (role.trim()) start();
            }}
            className="grid gap-4"
          >
            <div>
              <FieldLabel>Role you&apos;re interviewing for</FieldLabel>
              <TextInput required value={role} onChange={(e) => setRole(e.target.value)} maxLength={200} placeholder="e.g. Customer Support Executive" />
            </div>
            <div>
              <FieldLabel>Interview round</FieldLabel>
              <div className="grid gap-2 sm:grid-cols-3">
                {ROUNDS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRound(r.id)}
                    aria-pressed={round === r.id}
                    className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                      round === r.id ? "border-brand bg-brand-tonal" : "border-line hover:bg-sunken"
                    }`}
                  >
                    <p className="text-[13.5px] font-extrabold">{r.label}</p>
                    <p className="text-[12px] text-ink-2 mt-0.5 leading-snug">{r.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <RunButton loading={loading} disabled={!role.trim()}>Start mock interview</RunButton>
            </div>
          </form>
        </ToolCard>
      )}

      <ErrorNote error={error} />

      {started && (
        <>
          {turns.map((t, i) => (
            <ToolCard key={i}>
              <p className="text-[12px] font-extrabold text-ink-3 uppercase tracking-wide">Question {i + 1}</p>
              <p className="text-[14.5px] font-bold mt-1 leading-relaxed">{t.question}</p>
              <p className="text-[13.5px] text-ink-2 mt-3 leading-relaxed whitespace-pre-wrap border-l-2 border-line pl-3">{t.answer}</p>
              {t.feedback && (
                <div className="mt-4 rounded-2xl bg-sunken p-4 grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold">Coach feedback</span>
                    <span aria-label={`Rated ${t.feedback.rating} out of 5`} className="text-[13px] text-accent font-bold">
                      {"★".repeat(Math.max(1, Math.min(5, Math.round(t.feedback.rating))))}
                      <span className="text-ink-3">{"★".repeat(5 - Math.max(1, Math.min(5, Math.round(t.feedback.rating))))}</span>
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed"><span className="font-bold text-green-700">Worked:</span> {t.feedback.strengths}</p>
                  <p className="text-[13px] leading-relaxed"><span className="font-bold text-amber-700">Improve:</span> {t.feedback.improvement}</p>
                  <details className="text-[13px]">
                    <summary className="font-bold text-brand cursor-pointer">Show a strong sample answer</summary>
                    <p className="mt-2 leading-relaxed text-ink-2">{t.feedback.sampleAnswer}</p>
                  </details>
                </div>
              )}
            </ToolCard>
          ))}

          {pendingQuestion && !summary && (
            <ToolCard>
              <p className="text-[12px] font-extrabold text-brand uppercase tracking-wide">Question {turns.length + 1}</p>
              <p className="text-[15px] font-bold mt-1 leading-relaxed">{pendingQuestion}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (answer.trim()) submitAnswer();
                }}
                className="mt-4 grid gap-3"
              >
                <TextArea required rows={5} maxLength={4000} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer the way you would in a real interview…" />
                <div className="flex items-center gap-3 flex-wrap">
                  <RunButton loading={loading} disabled={!answer.trim()}>Submit answer</RunButton>
                  <button type="button" onClick={() => submitAnswer(true)} disabled={loading} className="text-[13px] font-extrabold text-ink-2 hover:text-ink cursor-pointer disabled:opacity-50">
                    End session &amp; get summary
                  </button>
                </div>
              </form>
            </ToolCard>
          )}

          {!pendingQuestion && !summary && loading && (
            <ToolCard><p className="text-[13.5px] text-ink-2">Preparing your interview…</p></ToolCard>
          )}

          {summary && (
            <ToolCard>
              <ResultHeading>Session summary</ResultHeading>
              <p className="text-[13.5px] leading-relaxed mt-3 whitespace-pre-wrap">{summary}</p>
              <button type="button" onClick={restart} className="mt-4 text-[13px] font-extrabold text-brand cursor-pointer">
                Start another session
              </button>
            </ToolCard>
          )}
        </>
      )}
    </ToolShell>
  );
}
