import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Cover-letter writer: profile + job description in, a full letter plus a
 *  short portal-chat/WhatsApp note out. Grounded strictly in the profile —
 *  the letter must never claim experience the candidate doesn't have. */

interface Input {
  profile: string;
  jobDescription: string;
  tone?: "professional" | "friendly" | "confident";
}

export interface CoverLetterResult {
  coverLetter: string;
  shortNote: string;
  subjectLine: string;
  tips: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    coverLetter: {
      type: Type.STRING,
      description: "Complete cover letter, 150–220 words, first person, ready to send. Paragraphs separated by blank lines. No [placeholders] — use only facts from the profile.",
    },
    shortNote: {
      type: Type.STRING,
      description: "3–4 sentence version for portal chat or WhatsApp: warm, direct, mentions 1–2 concrete strengths and asks for consideration.",
    },
    subjectLine: { type: Type.STRING, description: "Email subject line: role name + candidate's strongest qualifier" },
    tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1–3 short tips for sending this application (timing, attachments, follow-up)" },
  },
  required: ["coverLetter", "shortNote", "subjectLine", "tips"],
};

const SYSTEM = `You write cover letters for private-sector job seekers in India.
Indian recruiters skim: the first two lines must connect the candidate to THIS role, not recite a biography.
Rules:
- Use ONLY facts from the candidate's profile — never invent employers, years, tools, or metrics.
- Mirror the job description's key requirements where the candidate genuinely meets them.
- Plain, confident English; no buzzword soup ("dynamic team player"), no begging, no over-formality ("Respected Sir").
- If the candidate is a fresher, lead with education, projects, and eagerness to learn — honestly, not apologetically.
- No placeholder brackets. If the hiring manager's name is unknown, open with "Dear Hiring Team,".`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile);
  const jd = clampText(body.jobDescription, 8000);
  if (!profile || !jd) throw new Error("Missing profile or job description");
  const tone: Input["tone"] = ["professional", "friendly", "confident"].includes(body.tone ?? "") ? body.tone : "professional";

  const prompt = `Write the cover letter, short note, and subject line.\n\nTone: ${tone}.\n\nJob description:\n${jd}\n\nCandidate profile:\n${profile}`;
  return generateJSON<CoverLetterResult>({ system: SYSTEM, prompt, schema, temperature: 0.6 });
});
