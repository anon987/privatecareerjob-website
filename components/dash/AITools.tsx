"use client";

import Link from "next/link";
import { cardLift } from "./bits";

const TOOLS = [
  { icon: "📄", name: "AI Resume Builder", blurb: "Build a polished, ATS-friendly resume from your profile — free, no hidden charges.", href: "/dashboard/resume" },
  { icon: "🔍", name: "Resume Optimizer", blurb: "Honest feedback, line rewrites, and a headline recruiters stop for.", href: "/dashboard/ai/resume-optimizer" },
  { icon: "🤖", name: "ATS Score Checker", blurb: "Score your resume against a real job description before you apply.", href: "/dashboard/ai/ats-score" },
  { icon: "🎤", name: "Interview Coach", blurb: "Mock HR, technical, and English-practice rounds with feedback on every answer.", href: "/dashboard/ai/interview" },
  { icon: "🎯", name: "Job Match Assistant", blurb: "An honest fit check plus a ready-to-send note for the recruiter.", href: "/dashboard/ai/job-match" },
  { icon: "🧭", name: "Profile Optimizer", blurb: "Keywords, headline, and summary tuned for how recruiters actually search.", href: "/dashboard/ai/profile-optimizer" },
  { icon: "💰", name: "Salary Estimator", blurb: "Realistic CTC ranges for your city — with monthly in-hand, not just CTC.", href: "/dashboard/ai/salary" },
  { icon: "🗺️", name: "Career Roadmap", blurb: "Skill gaps and a step-by-step plan to the role you want next.", href: "/dashboard/ai/career-roadmap" },
];

/** AI hub — every card links to a working Gemini-powered tool. */
export default function AITools() {
  return (
    <div>
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">AI career tools</h1>
      <p className="text-ink-2 text-[14px] mt-1 max-w-[560px]">
        A suite of AI assistants built around your privatesectorjob profile — the help other portals charge thousands for, free with your account.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <Link key={t.name} href={t.href} className={`${cardLift} rise block`} aria-label={t.name}>
            <span aria-hidden className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-tonal text-[20px]">{t.icon}</span>
            <h2 className="text-[15.5px] font-extrabold mt-3">{t.name}</h2>
            <p className="text-[13px] text-ink-2 mt-1 leading-relaxed">{t.blurb}</p>
            <span className="inline-block mt-3 text-[12.5px] font-extrabold text-brand">Open tool →</span>
          </Link>
        ))}
      </div>
      <p className="text-[12.5px] text-ink-3 mt-5">Have a tool you&apos;d want next? Tell us from the app → Settings → Support.</p>
    </div>
  );
}
