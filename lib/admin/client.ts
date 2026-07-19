"use client";

import { auth } from "@/lib/firebaseClient";

/** Browser-side caller for /api/admin/* — attaches the Firebase ID token. */
export async function callAdmin<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in.");
  const token = await user.getIdToken();
  const res = await fetch(`/api/admin/${path}`, {
    method: init?.method ?? (init?.body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}
