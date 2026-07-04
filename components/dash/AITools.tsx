"use client";

import { cardLift } from "./bits";

const TOOLS = [
  { icon: "🔍", name: "Resume Review", blurb: "Instant feedback on structure, wording and impact." },
  { icon: "🎯", name: "Resume Tailoring", blurb: "Adapt your resume to a specific job description." },
  { icon: "✉️", name: "Cover Letter", blurb: "A tailored letter for any application, in seconds." },
  { icon: "🎤", name: "Interview Practice", blurb: "Realistic Q&A practice for your target role." },
  { icon: "🧭", name: "Career Coach", blurb: "Personalised next steps for your career path." },
  { icon: "🖼️", name: "Portfolio Review", blurb: "Suggestions to make your page convert recruiters." },
  { icon: "🤖", name: "ATS Checker", blurb: "Verify your resume parses cleanly in employer systems." },
  { icon: "💡", name: "Resume Headline", blurb: "A headline that makes recruiters stop scrolling." },
  { icon: "📝", name: "Professional Summary", blurb: "A crisp summary written from your experience." },
  { icon: "🔗", name: "LinkedIn Summary", blurb: "Consistent, polished copy for your LinkedIn too." },
];

/** AI hub — honest placeholders; each card is architecture-ready for a real tool. */
export default function AITools() {
  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">AI career tools</h1>
      <p className="text-ink-2 text-[14px] mt-1 max-w-[560px]">
        A suite of AI assistants built around your privatesectorjob profile. They're in development — everything below ships soon.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <article key={t.name} className={`${cardLift} rise relative`} aria-label={`${t.name} (coming soon)`}>
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-sunken text-[10.5px] font-bold text-ink-2">SOON</span>
            <span aria-hidden className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-tonal text-[20px]">{t.icon}</span>
            <h2 className="text-[15.5px] font-extrabold mt-3">{t.name}</h2>
            <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">{t.blurb}</p>
          </article>
        ))}
      </div>
      <p className="text-[12.5px] text-ink-3 mt-5">Have a tool you'd want first? Tell us from the app → Settings → Support.</p>
    </div>
  );
}
