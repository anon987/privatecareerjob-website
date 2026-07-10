"use client";

import { auth } from "@/lib/firebaseClient";

/** Browser-side caller for /api/ai/* — attaches the Firebase ID token. */

export class AiError extends Error {
  /** True when the backend says Vertex AI isn't configured yet. */
  setup: boolean;
  constructor(message: string, setup = false) {
    super(message);
    this.setup = setup;
  }
}

export async function callAiTool<T>(tool: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new AiError("Please sign in to use AI tools.");
  const token = await user.getIdToken();
  const res = await fetch(`/api/ai/${tool}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; setup?: boolean };
  if (!res.ok) throw new AiError(data.error ?? "Something went wrong. Please try again.", !!data.setup);
  return data as T;
}
