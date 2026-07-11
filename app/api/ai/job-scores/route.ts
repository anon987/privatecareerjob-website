import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute, clampText } from "@/lib/ai/route";

/** Batch job-match scoring for the jobs feed: one Gemini call scores every
 *  listed job against the seeker's profile, so cards can show real fit
 *  instead of keyword overlap. */

interface JobIn {
  id: string;
  title: string;
  category?: string;
  location?: string;
  experienceLevel?: string;
  jobType?: string;
  salary?: string;
  description?: string;
}

interface Input {
  profile: string;
  jobs: JobIn[];
}

export interface JobScore {
  id: string;
  score: number;
  reason: string;
}

export interface JobScoresResult {
  scores: JobScore[];
}

const MAX_JOBS = 30;

const schema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.ARRAY,
      description: "One entry per job, same ids as the input",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          score: { type: Type.NUMBER, description: "Honest fit 0–100" },
          reason: { type: Type.STRING, description: "One short line: the main reason for the score" },
        },
        required: ["id", "score", "reason"],
      },
    },
  },
  required: ["scores"],
};

const SYSTEM = `You score how well a job seeker matches job listings, for the Indian private-sector market.
Consider role/title alignment, skills, experience level, location (including remote), and domain.
Rules:
- Score every job you are given, keyed by its exact id.
- Be honest: 85+ means apply now, 60–84 worth a look, below 50 poor fit. Do not cluster everything at 70.
- The reason must be one short specific line ("Your Tally + GST skills fit, but they want 5+ years"), not generic praise.`;

export const POST = aiRoute<Input>(async (body) => {
  const profile = clampText(body.profile, 6000);
  if (!profile) throw new Error("Empty profile");
  const jobs = (Array.isArray(body.jobs) ? body.jobs : [])
    .slice(0, MAX_JOBS)
    .filter((j) => j && typeof j.id === "string" && j.id && typeof j.title === "string")
    .map((j) => ({
      id: j.id.slice(0, 64),
      title: clampText(j.title, 200),
      category: clampText(j.category, 100),
      location: clampText(j.location, 100),
      experienceLevel: clampText(j.experienceLevel, 60),
      jobType: clampText(j.jobType, 60),
      salary: clampText(j.salary, 60),
      description: clampText(j.description, 1500),
    }));
  if (!jobs.length) return { scores: [] } satisfies JobScoresResult;

  const jobLines = jobs
    .map(
      (j) =>
        `id: ${j.id}\ntitle: ${j.title}\n${[j.category, j.location, j.experienceLevel, j.jobType, j.salary].filter(Boolean).join(" · ")}${
          j.description ? `\n${j.description}` : ""
        }`
    )
    .join("\n---\n");

  const prompt = `Candidate profile:\n${profile}\n\nScore the candidate against each of these ${jobs.length} jobs:\n\n${jobLines}`;
  const result = await generateJSON<JobScoresResult>({ system: SYSTEM, prompt, schema, temperature: 0.1 });

  // Return only ids we were asked about, scores clamped to 0–100.
  const asked = new Set(jobs.map((j) => j.id));
  return {
    scores: (result.scores ?? [])
      .filter((s) => asked.has(s.id))
      .map((s) => ({ id: s.id, score: Math.max(0, Math.min(100, Math.round(s.score))), reason: (s.reason ?? "").slice(0, 200) })),
  } satisfies JobScoresResult;
});
