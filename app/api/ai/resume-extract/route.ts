import { Type } from "@google/genai";
import { generateJSON } from "@/lib/ai/gemini";
import { aiRoute } from "@/lib/ai/route";

/** Parses an uploaded resume PDF into the profile fields, so users can fill
 *  their profile from a resume instead of typing everything. Gemini reads
 *  the PDF natively — no parsing library involved. */

interface Input {
  /** base64 PDF, ≤ ~4 MB encoded */
  pdfBase64: string;
}

export interface ExtractedProfile {
  fullName: string;
  headline: string;
  summary: string;
  location: string;
  phone: string;
  skills: string[];
  languages: string[];
  experience: { role: string; company: string; period: string; description: string }[];
  education: { degree: string; school: string; year: string }[];
  certificates: { name: string; issuer: string; year: string }[];
  projects: { title: string; description: string }[];
}

const entry = (props: Record<string, { type: typeof Type.STRING }>) => ({
  type: Type.OBJECT,
  properties: props,
  required: Object.keys(props),
});

const schema = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING, description: "Candidate name; empty string if absent" },
    headline: { type: Type.STRING, description: "Professional headline/title; empty if absent" },
    summary: { type: Type.STRING, description: "Professional summary/objective; empty if absent" },
    location: { type: Type.STRING, description: "City/state; empty if absent" },
    phone: { type: Type.STRING, description: "Phone number; empty if absent" },
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    languages: { type: Type.ARRAY, items: { type: Type.STRING } },
    experience: {
      type: Type.ARRAY,
      items: entry({ role: { type: Type.STRING }, company: { type: Type.STRING }, period: { type: Type.STRING }, description: { type: Type.STRING } }),
    },
    education: {
      type: Type.ARRAY,
      items: entry({ degree: { type: Type.STRING }, school: { type: Type.STRING }, year: { type: Type.STRING } }),
    },
    certificates: {
      type: Type.ARRAY,
      items: entry({ name: { type: Type.STRING }, issuer: { type: Type.STRING }, year: { type: Type.STRING } }),
    },
    projects: {
      type: Type.ARRAY,
      items: entry({ title: { type: Type.STRING }, description: { type: Type.STRING } }),
    },
  },
  required: ["fullName", "headline", "summary", "location", "phone", "skills", "languages", "experience", "education", "certificates", "projects"],
};

const SYSTEM = `You extract structured data from resumes for an Indian job portal.
Rules:
- Copy only what the resume states — never infer or embellish. Empty string/array when a field is absent.
- Experience newest first; keep descriptions concise (≤ 40 words each).
- Skills as individual short items ("Tally ERP9", not "Tally ERP9 and GST filing").
- Do not put the email in any field.`;

export const POST = aiRoute<Input>(async (body) => {
  const pdf = typeof body.pdfBase64 === "string" ? body.pdfBase64.replace(/^data:.*?;base64,/, "") : "";
  if (!pdf) throw new Error("Missing PDF");
  if (pdf.length > 5_600_000) throw new Error("PDF too large"); // ~4 MB raw

  return generateJSON<ExtractedProfile>({
    system: SYSTEM,
    prompt: "Extract this resume into the structured profile fields.",
    schema,
    temperature: 0.1,
    media: { data: pdf, mimeType: "application/pdf" },
  });
});
