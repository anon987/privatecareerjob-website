"use client";

import { useEffect, useState } from "react";
import { callAdmin } from "@/lib/admin/client";

interface Msg {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "new" | "read" | "resolved";
  createdAt: number;
}

const BADGE: Record<Msg["status"], string> = {
  new: "bg-violet-100 text-violet-700",
  read: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

export default function AdminContacts() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState("");

  const load = () =>
    callAdmin<{ messages: Msg[] }>("contacts").then((d) => setMessages(d.messages)).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id: string, status: Msg["status"]) => {
    await callAdmin("contacts", { method: "PATCH", body: { id, status } }).catch(() => {});
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, status } : x)));
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this message permanently?")) return;
    await callAdmin(`contacts?id=${id}`, { method: "DELETE" }).catch(() => {});
    setMessages((m) => m.filter((x) => x.id !== id));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Contact messages</h1>
      <p className="mt-1 opacity-60">From the website contact form.</p>
      {err ? <p className="mt-6 text-red-600">{err}</p> : null}
      <div className="mt-8 space-y-4">
        {messages.length === 0 && !err ? <p className="opacity-60">No messages yet.</p> : null}
        {messages.map((m) => (
          <div key={m.id} className="rounded-2xl border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[m.status]}`}>{m.status}</span>
              <span className="font-semibold">{m.name}</span>
              <a href={`mailto:${m.email}`} className="text-sm text-violet-600 hover:underline">{m.email}</a>
              <span className="text-sm opacity-50">· {m.topic}</span>
              <span className="ml-auto text-xs opacity-50">
                {m.createdAt ? new Date(m.createdAt).toLocaleString("en-IN") : ""}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
            <div className="mt-4 flex gap-2 text-sm">
              {m.status !== "read" ? (
                <button onClick={() => setStatus(m.id, "read")} className="rounded-lg border border-black/15 px-3 py-1 hover:bg-neutral-50">Mark read</button>
              ) : null}
              {m.status !== "resolved" ? (
                <button onClick={() => setStatus(m.id, "resolved")} className="rounded-lg border border-green-300 px-3 py-1 text-green-700 hover:bg-green-50">Resolve</button>
              ) : null}
              <a href={`mailto:${m.email}?subject=Re: your message to privatecareerjob`} className="rounded-lg border border-black/15 px-3 py-1 hover:bg-neutral-50">Reply</a>
              <button onClick={() => remove(m.id)} className="ml-auto rounded-lg px-3 py-1 text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
