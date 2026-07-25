import { GoogleGenAI, type Schema } from "@google/genai";

/**
 * Server-side Gemini access through the Vertex AI platform. Authenticates via
 * Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or the
 * runtime's attached service account) — nothing here works until
 * GOOGLE_CLOUD_PROJECT points at a GCP project with Vertex AI enabled;
 * routes surface that as a friendly 503.
 *
 * The Vertex project is independent of the Firebase project: sign-in
 * verification stays on `privatecareerjob` (lib/ai/serverAuth.ts) while AI
 * calls run against whichever project GOOGLE_CLOUD_PROJECT names.
 */

const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "global";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

/** Service-account credentials for hosts with no filesystem key (Vercel):
 *  GOOGLE_SERVICE_ACCOUNT_KEY holds the key-file JSON as a string. Falls back
 *  to Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS path or
 *  attached service account) when unset. */
function credentialsFromEnv(): { client_email: string; private_key: string } | undefined {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return undefined;
  const key = JSON.parse(raw) as { client_email?: string; private_key?: string };
  if (!key.client_email || !key.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is set but is not a valid service-account key JSON");
  }
  // Env-var round-trips often escape newlines in the PEM block.
  return { client_email: key.client_email, private_key: key.private_key.replace(/\\n/g, "\n") };
}

export function gemini(): GoogleGenAI {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) throw new Error("GOOGLE_CLOUD_PROJECT is not set — Vertex AI is not configured");
  if (!client) {
    const credentials = credentialsFromEnv();
    client = new GoogleGenAI({
      vertexai: true,
      project,
      location: LOCATION,
      ...(credentials ? { googleAuthOptions: { credentials } } : {}),
    });
  }
  return client;
}

/** One structured-output call: system + prompt (optionally with an inline
 *  document, e.g. a PDF) in, schema-validated JSON out. */
export async function generateJSON<T>(opts: {
  system: string;
  prompt: string;
  schema: Schema;
  temperature?: number;
  /** base64-encoded document sent alongside the prompt */
  media?: { data: string; mimeType: string };
}): Promise<T> {
  const res = await gemini().models.generateContent({
    model: GEMINI_MODEL,
    contents: opts.media
      ? [{ inlineData: { data: opts.media.data, mimeType: opts.media.mimeType } }, { text: opts.prompt }]
      : opts.prompt,
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      responseSchema: opts.schema,
      temperature: opts.temperature ?? 0.4,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text) as T;
}
