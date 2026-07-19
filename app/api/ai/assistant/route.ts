import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Job Assistant: the conversational copilot behind the app's FAB. Stateless
 *  multi-turn chat — the client resends the transcript each call. Besides the
 *  reply it returns quick-reply suggestions and, when genuinely useful, deep
 *  links into the app's own tools (ids from ASSISTANT_TOOLS; the app maps them
 *  to routes). */

export const ASSISTANT_TOOLS = [
  "resume-builder",
  "resume-optimizer",
  "ats-score",
  "interview",
  "job-match",
  "profile-optimizer",
  "salary",
  "career-roadmap",
  "cover-letter",
  "scam-check",
  "profile-coach",
  "jobs",
  "applications",
] as const;

export type AssistantToolId = (typeof ASSISTANT_TOOLS)[number];

interface Turn {
  role: "user" | "assistant";
  text: string;
}

interface Input {
  history: Turn[];
  /** flattened profile of the signed-in seeker, for personalised answers */
  profile?: string;
}

export interface AssistantResult {
  reply: string;
  suggestions: string[];
  tools: { label: string; tool: AssistantToolId }[];
}

const MAX_TURNS = 24;

const schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "The assistant's reply. Chat-sized: 1–4 short paragraphs or a tight list, mobile-friendly. Plain text, no markdown headers." },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Up to 3 short quick-reply chips the user might tap next (≤ 6 words each, first person). Empty if none fit.",
    },
    tools: {
      type: Type.ARRAY,
      description: "0–2 in-app tools that directly help with what was just discussed. Only include a tool when it clearly advances the user's goal — not as decoration.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Button label, e.g. 'Practice HR questions'" },
          tool: { type: Type.STRING, enum: [...ASSISTANT_TOOLS] },
        },
        required: ["label", "tool"],
      },
    },
  },
  required: ["reply", "suggestions", "tools"],
};

const SYSTEM = `You are the Job Assistant inside privatesectorjob, a mobile job platform for private-sector job seekers and students in India.
You help with: finding the right roles, applications and follow-ups, resumes, interviews, salary/CTC questions, career changes, workplace questions (notice period, offer letters, PF/ESI basics), and spotting job scams.
The app has built-in tools you can hand off to: resume-builder (make a resume), resume-optimizer (improve resume text), ats-score (score resume vs a JD), interview (mock interview practice), job-match (fit check for a job), profile-optimizer (better headline/keywords), salary (CTC estimate for a role+city), career-roadmap (plan to a target role), cover-letter (write an application note), scam-check (check a suspicious offer), profile-coach (complete their profile), jobs (browse the job feed), applications (their application tracker).
Rules:
- Chat style: warm, direct, concise. Many users are students, freshers, or speak English as a second language — simple words, short sentences. Reply in Hindi if the user writes in Hindi.
- Be honest and practical for the INDIAN market (CTC vs in-hand, notice periods, Naukri-style keyword search, walk-ins). Never invent facts about the user or specific live job listings — for listings, point them to the jobs feed.
- Never advise paying any fee for a job; if a message smells like a scam, say so and offer scam-check.
- Use the candidate's profile context when given; if a question needs info you don't have, ask one short follow-up question.
- Suggest a tool only when it genuinely helps the current request; prefer answering directly first.
- No legal/medical/financial guarantees; for serious legal disputes suggest a professional.`;

export const POST = aiRoute<Input>(async (body) => {
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t?.role === "assistant" ? "assistant" : "user", text: clampText(t?.text, 2000) }))
    .filter((t) => t.text);
  if (!history.length || history[history.length - 1].role !== "user") throw new Error("Missing user message");
  const profile = clampText(body.profile, 4000);

  const transcript = history.map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.text}`).join("\n\n");

  const prompt = [
    profile ? `Candidate profile (context, may be incomplete):\n${profile}` : "No profile context available.",
    `Conversation so far:\n${transcript}`,
    `Write the assistant's next reply.`,
  ].join("\n\n");

  return generateJSON<AssistantResult>({ system: SYSTEM, prompt, schema, temperature: 0.6 });
});
