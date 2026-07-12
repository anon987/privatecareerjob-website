import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Inline field enhancer for the resume builder: polishes the user's own
 *  summary/headline text without inventing anything new. */

type Kind = "summary" | "headline";

interface Input {
  kind: Kind;
  text: string;
  /** skills / roles context so wording aligns with the rest of the resume */
  context?: string;
}

export interface EnhanceResult {
  improved: string;
}

const schema = {
  type: Type.OBJECT,
  properties: {
    improved: { type: Type.STRING, description: "The improved text, and nothing else" },
  },
  required: ["improved"],
};

const BRIEF: Record<Kind, string> = {
  summary:
    "Rewrite this resume professional summary: first person, confident, specific, max 55 words (it must fit a one-page resume). Keep every fact; sharpen wording and lead with the strongest point.",
  headline:
    "Rewrite this resume headline: searchable job title first, then key specialisation. Max 8 words, no fluff, no first person.",
};

const SYSTEM = `You polish resume text for the Indian private-sector job market.
Rules:
- NEVER add facts, skills, employers, numbers, or years that are not in the original text or context.
- Keep the candidate's meaning; improve clarity, impact, and keyword strength.
- Plain, confident English — no buzzword soup ("synergy", "dynamic go-getter").
- Return only the improved text.`;

export const POST = aiRoute<Input>(async (body) => {
  const kind: Kind = body.kind === "headline" ? "headline" : "summary";
  const text = clampText(body.text, 2000);
  if (!text) throw new Error("Nothing to enhance");
  const context = clampText(body.context, 1500);

  const prompt = [
    BRIEF[kind],
    context ? `Candidate context (for keyword alignment only — do not import facts the text doesn't claim):\n${context}` : "",
    `Text to improve:\n${text}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return generateJSON<EnhanceResult>({ system: SYSTEM, prompt, schema, temperature: 0.5 });
});
