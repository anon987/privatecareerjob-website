import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

export type InterviewRound = "hr" | "technical" | "communication";

interface Turn {
  question: string;
  answer: string;
}

interface Input {
  role: string;
  round: InterviewRound;
  history: Turn[];
  /** true when the candidate wants to end the session and get the summary */
  finish?: boolean;
}

export interface InterviewResult {
  feedback: {
    rating: number;
    strengths: string;
    improvement: string;
    sampleAnswer: string;
  } | null;
  nextQuestion: string;
  finished: boolean;
  summary: string;
}

const MAX_QUESTIONS = 6;

const schema = {
  type: Type.OBJECT,
  properties: {
    feedback: {
      type: Type.OBJECT,
      nullable: true,
      description: "Feedback on the candidate's most recent answer; null when there is no answer yet",
      properties: {
        rating: { type: Type.NUMBER, description: "1–5 for the latest answer" },
        strengths: { type: Type.STRING, description: "What worked in the answer, one or two sentences" },
        improvement: { type: Type.STRING, description: "The single most useful improvement" },
        sampleAnswer: { type: Type.STRING, description: "A strong sample answer the candidate can learn from, in first person" },
      },
      required: ["rating", "strengths", "improvement", "sampleAnswer"],
    },
    nextQuestion: { type: Type.STRING, description: "The next interview question; empty string when the session is finished" },
    finished: { type: Type.BOOLEAN },
    summary: { type: Type.STRING, description: "Overall session feedback when finished; empty string otherwise" },
  },
  required: ["feedback", "nextQuestion", "finished", "summary"],
};

const ROUND_BRIEF: Record<InterviewRound, string> = {
  hr: "an HR round: motivation, strengths/weaknesses, salary expectations (CTC), notice period, relocation, why this company. Common in Indian hiring.",
  technical: "a technical/functional round: role-specific scenarios, tools, process questions, problem-solving. Match difficulty to the role.",
  communication: "an English communication practice round: everyday workplace questions that build fluency and confidence. Gently correct grammar in feedback without mocking.",
};

const SYSTEM = `You are a warm but honest interview coach for job seekers in India, many of whom are nervous or speak English as a second language.
Run a realistic mock interview, one question at a time.
Rules:
- Ask one question at a time; keep questions realistic for the role and round.
- Feedback must be encouraging, specific, and practical — never condescending.
- Sample answers should be achievable for this candidate, not superhuman.
- Ratings: 5 = excellent, 3 = acceptable, 1 = needs a lot of work. Be honest.
- In the final summary: overall readiness, top 2 strengths, top 2 things to practise.`;

export const POST = aiRoute<Input>(async (body) => {
  const role = clampText(body.role, 200);
  if (!role) throw new Error("Missing role");
  const round: InterviewRound = ["hr", "technical", "communication"].includes(body.round) ? body.round : "hr";
  const history = (Array.isArray(body.history) ? body.history : []).slice(0, MAX_QUESTIONS).map((t) => ({
    question: clampText(t?.question, 1000),
    answer: clampText(t?.answer, 4000),
  }));
  const mustFinish = !!body.finish || history.length >= MAX_QUESTIONS;

  const transcript = history.map((t, i) => `Q${i + 1}: ${t.question}\nCandidate: ${t.answer}`).join("\n\n");

  const prompt = [
    `Mock interview for the role: ${role}.`,
    `This is ${ROUND_BRIEF[round]}`,
    history.length ? `Transcript so far:\n${transcript}` : "No questions asked yet — open the interview with the first question.",
    history.length ? "Give feedback on the candidate's LAST answer." : "",
    mustFinish
      ? "The session is over: set finished=true, nextQuestion to an empty string, and write the overall summary."
      : `Then ask question ${history.length + 1} of ${MAX_QUESTIONS} (finished=false, summary empty).`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateJSON<InterviewResult>({ system: SYSTEM, prompt, schema, temperature: 0.6 });
});
