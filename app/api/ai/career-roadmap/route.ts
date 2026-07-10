import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

interface Input {
  profile: string;
  targetRole: string;
}

export interface CareerRoadmapResult {
  feasibility: string;
  skillsYouHave: string[];
  skillsToLearn: { skill: string; why: string; how: string }[];
  milestones: { period: string; title: string; actions: string[] }[];
  watchOuts: string[];
}

const schema = {
  type: Type.OBJECT,
  properties: {
    feasibility: { type: Type.STRING, description: "Honest 1–2 sentence read: how realistic is this move and roughly how long it takes" },
    skillsYouHave: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Existing skills that transfer to the target role" },
    skillsToLearn: {
      type: Type.ARRAY,
      description: "Prioritised skill gaps, most important first",
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          why: { type: Type.STRING, description: "Why this matters for the target role" },
          how: { type: Type.STRING, description: "Concrete, low-cost way to learn it (free courses, practice projects, certifications available in India)" },
        },
        required: ["skill", "why", "how"],
      },
    },
    milestones: {
      type: Type.ARRAY,
      description: "Step-by-step plan in time blocks (e.g. Month 1–2, Month 3–4)",
      items: {
        type: Type.OBJECT,
        properties: {
          period: { type: Type.STRING },
          title: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["period", "title", "actions"],
      },
    },
    watchOuts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Realistic pitfalls: salary dips, paid-course scams, timing mistakes" },
  },
  required: ["feasibility", "skillsYouHave", "skillsToLearn", "milestones", "watchOuts"],
};

const SYSTEM = `You are a practical career coach for job seekers in India.
Build a realistic growth plan from the candidate's current profile to their target role.
Rules:
- Be honest about feasibility — do not promise "become a data scientist in 30 days".
- Prefer free or low-cost learning (YouTube, NPTEL/SWAYAM, free tiers, practice projects) over expensive bootcamps; warn about overpriced course scams.
- Milestones must fit around a full-time job unless the profile says otherwise.
- Keep the plan role-specific, not generic self-help.`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile);
  const targetRole = clampText(body.targetRole, 200);
  if (!profile || !targetRole) throw new Error("Missing profile or target role");

  const prompt = `Build a career roadmap.\n\nTarget role: ${targetRole}\n\nCurrent profile:\n${profile}`;
  return generateJSON<CareerRoadmapResult>({ system: SYSTEM, prompt, schema, temperature: 0.5 });
});
