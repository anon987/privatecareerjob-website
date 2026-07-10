import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

interface Input {
  resume: string;
  targetRole?: string;
  jobDescription?: string;
}

export interface ResumeOptimizerResult {
  score: number;
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  rewrites: { original: string; improved: string; reason: string }[];
  keywords: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "Overall resume strength, 0–100" },
    headline: { type: Type.STRING, description: "One-line professional headline for the candidate" },
    summary: { type: Type.STRING, description: "3–4 sentence professional summary written from the resume" },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What already works well" },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Concrete, prioritised fixes" },
    rewrites: {
      type: Type.ARRAY,
      description: "Up to 5 weak lines rewritten with impact",
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          improved: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ["original", "improved", "reason"],
      },
    },
    keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords recruiters search for that are missing or under-used" },
  },
  required: ["score", "headline", "summary", "strengths", "improvements", "rewrites", "keywords"],
};

const SYSTEM = `You are a senior resume writer and recruiter for the Indian private-sector job market.
Indian recruiters shortlist by keyword search (Naukri/LinkedIn style), so keyword coverage and a sharp headline matter as much as writing quality.
Rules:
- Never invent experience, employers, metrics, or skills the candidate did not state.
- Prefer concrete, quantified phrasing; flag vague lines.
- Keep suggestions realistic for the candidate's actual seniority.
- Use Indian salary/market conventions where relevant (CTC, notice period).
- Write in clear, simple English.`;

export const POST = aiRoute<Input>(async (body) => {
  const resume = clampText(body.resume);
  if (!resume) throw new Error("Empty resume");
  const targetRole = clampText(body.targetRole, 200);
  const jd = clampText(body.jobDescription, 8000);

  const prompt = [
    `Review this resume and return structured feedback.`,
    targetRole ? `Target role: ${targetRole}` : "",
    jd ? `Tailor the feedback and keywords to this job description:\n${jd}` : "",
    `Resume:\n${resume}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateJSON<ResumeOptimizerResult>({ system: SYSTEM, prompt, schema });
});
