import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Profile-completion assistant: reads the saved profile + the deterministic
 *  completeness checklist and returns prioritised actions and ready-to-apply
 *  drafts. The percentage itself is computed client-side, never by the AI. */

interface Input {
  profile: string;
  completenessPct: number;
  missing: string[];
}

export interface ProfileAssistantResult {
  assessment: string;
  tips: { section: string; action: string; example: string }[];
  headlineDraft: string;
  summaryDraft: string;
  skillSuggestions: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    assessment: { type: Type.STRING, description: "1–2 friendly, honest sentences about where this profile stands" },
    tips: {
      type: Type.ARRAY,
      description: "3–5 prioritised actions, most impactful first. Missing sections come before polish.",
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, description: "Which profile section this is about (e.g. Experience, Skills, Headline)" },
          action: { type: Type.STRING, description: "One concrete instruction ('Add your 2 most recent roles with one achievement each')" },
          example: { type: Type.STRING, description: "A short filled-in example the user can copy the pattern of; empty string if not useful" },
        },
        required: ["section", "action", "example"],
      },
    },
    headlineDraft: { type: Type.STRING, description: "A ready-to-use headline based on the profile; empty string if the current one is already good or there is too little info to write one honestly" },
    summaryDraft: { type: Type.STRING, description: "A ready-to-use 2–3 sentence first-person summary; empty string if the current one is already good or info is too thin" },
    skillSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skills clearly implied by the profile but not listed; empty if none" },
  },
  required: ["assessment", "tips", "headlineDraft", "summaryDraft", "skillSuggestions"],
};

const SYSTEM = `You are a friendly profile-completion coach for an Indian job portal.
Recruiters find candidates by keyword search, and complete profiles get dramatically more recruiter views — your job is to get this profile to 100% with content that is specific and searchable.
Rules:
- Prioritise: empty sections first (they block completeness), then weak content (vague headline, one-line summary, skill-less experience).
- Every action must be doable in under 5 minutes and name the exact section.
- Drafts must be built ONLY from what the profile already says — never invent employers, years, or skills. If there isn't enough information for an honest draft, return an empty string for it.
- Suggested skills must be clearly implied by the stated experience (e.g. "GST filing" implies "Taxation").
- Warm, simple English. Never scold.`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile, 8000);
  const pct = Math.max(0, Math.min(100, Math.round(Number(body.completenessPct) || 0)));
  const missing = (Array.isArray(body.missing) ? body.missing : []).map((m) => clampText(m, 40)).filter(Boolean).slice(0, 12);

  const prompt = [
    `Profile completeness: ${pct}%.`,
    missing.length ? `Empty sections: ${missing.join(", ")}.` : "All checklist sections have something in them — focus on making the content stronger.",
    `Profile:\n${profile || "(completely empty profile)"}`,
  ].join("\n\n");

  return generateJSON<ProfileAssistantResult>({ system: SYSTEM, prompt, schema, temperature: 0.5 });
});
