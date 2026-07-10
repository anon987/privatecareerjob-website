import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

interface Input {
  profile: string;
  jobDescription: string;
}

export interface JobMatchResult {
  fitScore: number;
  verdict: string;
  reasonsToApply: string[];
  gaps: string[];
  applicationTips: string[];
  pitchMessage: string;
}

const schema = {
  type: Type.OBJECT,
  properties: {
    fitScore: { type: Type.NUMBER, description: "Honest role-fit score, 0–100" },
    verdict: { type: Type.STRING, description: "One plain-English line: should this candidate apply, and why" },
    reasonsToApply: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Genuine strengths the candidate brings to THIS role" },
    gaps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Requirements the candidate does not clearly meet" },
    applicationTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "How to position the application given the gaps" },
    pitchMessage: { type: Type.STRING, description: "Short 3–4 sentence first-person note the candidate can send to the recruiter with their application" },
  },
  required: ["fitScore", "verdict", "reasonsToApply", "gaps", "applicationTips", "pitchMessage"],
};

const SYSTEM = `You are a straight-talking career advisor for the Indian job market.
A candidate wants to know if a specific job is worth applying to and how to pitch themselves.
Rules:
- Be honest about fit — an inflated score wastes the candidate's time and the recruiter's.
- Consider experience level, skills, domain, location, and salary signals in the JD.
- Gaps must come from the JD, not invented requirements.
- The pitch message should sound like a real person, mention 1–2 concrete strengths, and never oversell. Indian recruiters receive it via portal chat or email.`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile);
  const jd = clampText(body.jobDescription, 8000);
  if (!profile || !jd) throw new Error("Missing profile or job description");

  const prompt = `Assess this candidate against this job.\n\nJob description:\n${jd}\n\nCandidate profile:\n${profile}`;
  return generateJSON<JobMatchResult>({ system: SYSTEM, prompt, schema, temperature: 0.3 });
});
