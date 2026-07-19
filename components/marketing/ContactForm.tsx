"use client";

import { useState } from "react";

/** Public contact form → /api/contact → contactMessages (admin panel inbox). */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "General", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setErr("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not send your message.");
      setState("sent");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Could not send your message.");
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 text-lg font-semibold">Message sent</p>
        <p className="mt-1 text-sm opacity-70">Thanks — we read every message and reply by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold">Send us a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <input required className="rounded-xl border border-black/15 px-4 py-2.5" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" className="rounded-xl border border-black/15 px-4 py-2.5" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <select className="w-full rounded-xl border border-black/15 px-4 py-2.5" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
        {["General", "Job seeker support", "Recruiter onboarding", "Partnership", "Report a problem"].map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <textarea required rows={5} className="w-full rounded-xl border border-black/15 px-4 py-2.5" placeholder="How can we help?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button disabled={state === "sending"} className="w-full rounded-xl bg-violet-600 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
