import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

interface Input {
  resume: string;
  jobDescription: string;
}

export interface AtsScoreResult {
  score: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  sectionChecks: { section: string; status: "pass" | "warn" | "fail"; note: string }[];
  formattingTips: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER, description: "ATS match score against the job description, 0–100" },
    verdict: { type: Type.STRING, description: "One plain-English line: how likely this resume is to pass screening for this job" },
    matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "JD keywords the resume already covers" },
    missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important JD keywords the resume is missing" },
    sectionChecks: {
      type: Type.ARRAY,
      description: "Checks on resume structure: contact info, headline, summary, skills, experience, education",
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["pass", "warn", "fail"] },
          note: { type: Type.STRING },
        },
        required: ["section", "status", "note"],
      },
    },
    formattingTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Parse-safety tips (tables, images, columns, fonts, file naming)" },
  },
  required: ["score", "verdict", "matchedKeywords", "missingKeywords", "sectionChecks", "formattingTips"],
};

const SYSTEM = `You are an ATS (applicant tracking system) analyst for the Indian job market, where recruiters shortlist by keyword search.
Score how well a resume matches a specific job description, the way screening software and a keyword-searching recruiter would.
Rules:
- Score honestly: keyword coverage, title/role alignment, experience-level fit, and structure all count.
- Extract keywords from the JD itself; do not invent requirements.
- Only flag missing keywords the candidate could truthfully add; note transferable matches (e.g. "MS Excel" covers "spreadsheets").
- Keep every note short and actionable.`;

export const POST = aiRoute<Input>(async (body) => {
  const resume = clampText(body.resume);
  const jd = clampText(body.jobDescription, 8000);
  if (!resume || !jd) throw new Error("Missing resume or job description");

  const prompt = `Score this resume against this job description.\n\nJob description:\n${jd}\n\nResume:\n${resume}`;
  return generateJSON<AtsScoreResult>({ system: SYSTEM, prompt, schema, temperature: 0.2 });
});
