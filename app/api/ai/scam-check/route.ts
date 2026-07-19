import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Job-scam detector: paste a job offer, recruiter message, or email and get an
 *  honest risk read. Freshers are the #1 target of fee/deposit scams in India —
 *  this is a trust feature, so it must never soften a real red flag. */

interface Input {
  text: string;
}

export interface ScamCheckResult {
  riskScore: number;
  riskLevel: "safe" | "caution" | "danger";
  verdict: string;
  redFlags: { flag: string; explanation: string }[];
  greenFlags: string[];
  safetyTips: string[];
  recommendation: string;
}

const schema = {
  type: Type.OBJECT,
  properties: {
    riskScore: { type: Type.NUMBER, description: "Scam likelihood 0–100 (0 = clearly legitimate, 100 = certain scam)" },
    riskLevel: { type: Type.STRING, enum: ["safe", "caution", "danger"], description: "safe ≤ 30, caution 31–65, danger > 65" },
    verdict: { type: Type.STRING, description: "One plain-English line summarising the risk" },
    redFlags: {
      type: Type.ARRAY,
      description: "Specific warning signs found in THIS text, most serious first; empty if none",
      items: {
        type: Type.OBJECT,
        properties: {
          flag: { type: Type.STRING, description: "Short name of the warning sign" },
          explanation: { type: Type.STRING, description: "Why this is suspicious, quoting the text where useful" },
        },
        required: ["flag", "explanation"],
      },
    },
    greenFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Genuine signs of legitimacy found in the text; empty if none" },
    safetyTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What the candidate should verify or do next (check company on MCA/GST, call official number, never pay, etc.)" },
    recommendation: { type: Type.STRING, description: "One clear action line: proceed / verify these things first / do not engage" },
  },
  required: ["riskScore", "riskLevel", "verdict", "redFlags", "greenFlags", "safetyTips", "recommendation"],
};

const SYSTEM = `You are a job-scam analyst protecting job seekers in India, where fresher-targeting scams are rampant.
Analyse the pasted job offer / recruiter message / email for fraud signals.
Well-known Indian job-scam patterns (non-exhaustive):
- Any upfront money: registration fee, security deposit, training fee, laptop fee, courier/document charge, "refundable" anything.
- Pay to earn: Telegram/YouTube like-subscribe tasks, crypto top-ups, prepaid "work kits".
- Unrealistic pay for trivial work; instant offers with no interview; urgency and secrecy pressure.
- Personal-domain email (gmail/yahoo) claiming to be a big company; WhatsApp-only "HR"; asking for OTP, Aadhaar, PAN, or bank details before an offer letter.
- Fake placement consultancies charging for "guaranteed" jobs.
Rules:
- Judge only from the text given; do not invent details. If the text is too short to judge, say so and keep riskLevel "caution".
- A real company name in the text does NOT make it safe — impersonation is the most common trick.
- Never advise paying any fee for a job. Ever.
- Keep every item short, specific, and in simple English.`;

export const POST = aiRoute<Input>(async (body) => {
  const text = clampText(body.text, 8000);
  if (!text) throw new Error("Nothing to check");

  const prompt = `Analyse this for job-scam signals:\n\n${text}`;
  return generateJSON<ScamCheckResult>({ system: SYSTEM, prompt, schema, temperature: 0.2 });
});
