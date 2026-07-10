import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

interface Input {
  profile: string;
  targetRole?: string;
}

export interface ProfileOptimizerResult {
  completeness: number;
  headline: string;
  headlineAlternatives: string[];
  summary: string;
  linkedinSummary: string;
  keywordSuggestions: string[];
  quickWins: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    completeness: { type: Type.NUMBER, description: "How strong/complete the profile is for recruiter search, 0–100" },
    headline: { type: Type.STRING, description: "Best recruiter-search-friendly headline for this candidate" },
    headlineAlternatives: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2–3 alternative headlines with different emphasis" },
    summary: { type: Type.STRING, description: "Improved profile summary, 3–4 sentences, first person" },
    linkedinSummary: { type: Type.STRING, description: "LinkedIn About section version — slightly longer, warmer, first person" },
    keywordSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Search keywords to add to skills/headline so recruiters find this profile" },
    quickWins: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Prioritised actions: missing sections to fill, weak areas to strengthen" },
  },
  required: ["completeness", "headline", "headlineAlternatives", "summary", "linkedinSummary", "keywordSuggestions", "quickWins"],
};

const SYSTEM = `You are a profile-visibility expert for the Indian job market.
Indian recruiters find candidates through keyword search on portals (Naukri-style) and LinkedIn — a profile that isn't keyword-rich is invisible, no matter how good the candidate is.
Rules:
- Headlines must lead with the searchable job title, then skills/specialisation. No fluffy taglines.
- Only suggest keywords supported by the candidate's actual experience.
- Quick wins must be specific ("add years of experience to your headline"), not generic advice.
- Write in clear, simple English; first person for summaries.`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile);
  if (!profile) throw new Error("Empty profile");
  const targetRole = clampText(body.targetRole, 200);

  const prompt = [
    "Analyse this candidate profile for recruiter-search visibility and completeness, then improve it.",
    targetRole ? `The candidate is targeting: ${targetRole}` : "",
    `Profile:\n${profile}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateJSON<ProfileOptimizerResult>({ system: SYSTEM, prompt, schema });
});
