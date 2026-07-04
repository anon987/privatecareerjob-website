"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDash } from "./Shell";
import { card, companyInitials, Empty } from "./bits";
import { sendMessage, timeAgo, useMessages, useThreads } from "@/lib/seeker";

/** Real-time messaging — same threads/{seekerUid__recruiterUid}/messages as the app. */
export default function Messages() {
  const { user } = useDash();
  const params = useSearchParams();
  const { threads, loading } = useThreads(user.uid);
  const [selected, setSelected] = useState<string | null>(params.get("t"));
  const active = threads.find((t) => t.id === selected) ?? (selected === null ? threads[0] : undefined);
  const messages = useMessages(active?.id);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, active?.id]);

  const send = async () => {
    if (!active || !text.trim()) return;
    const t = text;
    setText("");
    await sendMessage(active.id, user.uid, t).catch(() => setText(t));
  };

  if (!loading && threads.length === 0) {
    return (
      <div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Messages</h1>
        <Empty title="No conversations yet" body="Apply to a job, then message the recruiter — chats appear here and in the app, in real time." />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">Messages</h1>
      <div className="mt-4 grid md:grid-cols-[300px_1fr] gap-3 items-start">
        {/* thread list */}
        <div className={`${card} !p-2 max-h-[70vh] overflow-y-auto ${active ? "hidden md:block" : ""}`}>
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={`w-full text-left px-3.5 py-3 rounded-2xl transition cursor-pointer flex items-start gap-3 ${t.id === active?.id ? "bg-brand-tonal" : "hover:bg-sunken"}`}
            >
              <span aria-hidden className="grid place-items-center w-10 h-10 rounded-xl bg-brand-tonal text-brand text-[13px] font-extrabold shrink-0">
                {companyInitials(t.companyName || "Company")}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <b className="text-[14px] truncate">{t.companyName || "Company"}</b>
                  {t.lastMessageAt && <span className="text-[11.5px] text-ink-3 whitespace-nowrap">{timeAgo(t.lastMessageAt)}</span>}
                </span>
                {t.jobTitle && <span className="block text-[12px] text-brand font-semibold truncate">{t.jobTitle}</span>}
                <span className="block text-[12.5px] text-ink-2 truncate mt-0.5">{t.lastMessage || "Say hello 👋"}</span>
              </span>
            </button>
          ))}
        </div>

        {/* chat pane */}
        {active ? (
          <div className={`${card} !p-0 flex flex-col h-[70vh]`}>
            <div className="px-5 py-3.5 border-b border-line flex items-center gap-3">
              <button onClick={() => setSelected("")} className="md:hidden font-bold text-brand cursor-pointer min-w-9 min-h-9" aria-label="Back to conversations">←</button>
              <span aria-hidden className="grid place-items-center w-9 h-9 rounded-xl bg-brand-tonal text-brand text-[12px] font-extrabold shrink-0">
                {companyInitials(active.companyName || "Company")}
              </span>
              <div>
                <b className="text-[15px]">{active.companyName || "Company"}</b>
                {active.jobTitle && <p className="text-[12.5px] text-ink-2">{active.jobTitle}</p>}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-paper">
              {messages.map((m) => {
                const mine = m.from === user.uid;
                return (
                  <div key={m.id} className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${
                    mine ? "ml-auto bg-brand text-white rounded-br-md" : "bg-white border border-line rounded-bl-md"
                  }`}>
                    {m.text}
                    <div className={`text-[10.5px] mt-1 ${mine ? "text-white/70" : "text-ink-3"}`}>{timeAgo(m.sentAt)}</div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="p-3 border-t border-line flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message…"
                aria-label="Message"
                className="flex-1 min-h-11 px-4 rounded-full border border-line bg-paper outline-none focus:border-brand transition text-[14.5px]"
              />
              <button type="submit" disabled={!text.trim()} className="min-h-11 px-5 rounded-full bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition disabled:opacity-50 cursor-pointer">
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className={`${card} hidden md:grid place-items-center h-[70vh] text-ink-3 text-[14px]`}>Pick a conversation</div>
        )}
      </div>
    </div>
  );
}
