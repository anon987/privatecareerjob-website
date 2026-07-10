import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";
import { inHandFromCtc, type InHandBreakdown } from "@/lib/ai/salary";

interface Input {
  role: string;
  city: string;
  yearsExperience: number;
  skills?: string;
  currentCtcLpa?: number;
}

interface Estimate {
  minLpa: number;
  medianLpa: number;
  maxLpa: number;
  summary: string;
  factors: string[];
  negotiationTips: string[];
}

export interface SalaryResult extends Estimate {
  inHand: { min: InHandBreakdown; median: InHandBreakdown; max: InHandBreakdown };
}

const schema = {
  type: Type.OBJECT,
  properties: {
    minLpa: { type: Type.NUMBER, description: "Conservative annual CTC in lakhs (LPA) for this role/city/experience" },
    medianLpa: { type: Type.NUMBER, description: "Typical annual CTC in LPA" },
    maxLpa: { type: Type.NUMBER, description: "Strong-offer annual CTC in LPA" },
    summary: { type: Type.STRING, description: "2–3 sentences of context: what drives pay for this role in this city" },
    factors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Factors that move this candidate up or down the range" },
    negotiationTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Practical negotiation tips for the Indian context (CTC structure, variable pay, notice-period buyout, competing offers)" },
  },
  required: ["minLpa", "medianLpa", "maxLpa", "summary", "factors", "negotiationTips"],
};

const SYSTEM = `You are a compensation analyst for the Indian private-sector job market.
Estimate realistic annual CTC ranges in lakhs (LPA) based on role, city tier, experience, and skills.
Rules:
- Ranges must reflect the Indian market: city matters (metro vs tier-2/3), so does company type.
- Be conservative and realistic — do not quote FAANG-style outliers as the max.
- If the candidate shares a current CTC, anchor the realistic hike range to it (typical hikes: 20–40% for a switch).
- Never present these numbers as guaranteed; they are market estimates.
- Tips must reflect Indian hiring: CTC vs in-hand, fixed vs variable split, notice-period negotiation.`;

export const POST = aiRoute<Input>(async (body) => {
  const role = clampText(body.role, 200);
  const city = clampText(body.city, 100);
  if (!role || !city) throw new Error("Missing role or city");
  const years = Math.max(0, Math.min(50, Number(body.yearsExperience) || 0));
  const skills = clampText(body.skills, 500);
  const currentCtc = Number(body.currentCtcLpa) > 0 ? Math.min(500, Number(body.currentCtcLpa)) : undefined;

  const prompt = [
    `Estimate the salary range for this candidate.`,
    `Role: ${role}`,
    `City: ${city}`,
    `Experience: ${years} years`,
    skills ? `Key skills: ${skills}` : "",
    currentCtc ? `Current CTC: ${currentCtc} LPA` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const est = await generateJSON<Estimate>({ system: SYSTEM, prompt, schema, temperature: 0.2 });

  // Keep the range ordered even if the model wobbles.
  const [min, median, max] = [est.minLpa, est.medianLpa, est.maxLpa].map((n) => Math.max(0.5, n)).sort((a, b) => a - b);

  const result: SalaryResult = {
    ...est,
    minLpa: min,
    medianLpa: median,
    maxLpa: max,
    inHand: {
      min: inHandFromCtc(min * 100000),
      median: inHandFromCtc(median * 100000),
      max: inHandFromCtc(max * 100000),
    },
  };
  return result;
});
