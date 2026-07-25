"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Check, Download, FileText, Gauge, IndianRupee, LayoutGrid, Palette, Sparkles, WandSparkles } from "lucide-react";
import { ButtonLink, CTASection, FAQSection, SectionHeading } from "./MarketingSections";

/* ---------------- static resume mock (pure CSS, no data) ---------------- */

type MockLayout = "single" | "left" | "right";

function Lines({ n, w = [100, 92, 84], light = false }: { n: number; w?: number[]; light?: boolean }) {
  return (
    <div className="space-y-[3px]">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`h-[3px] rounded-full ${light ? "bg-white/50" : "bg-[#E7E7EF]"}`} style={{ width: `${w[i % w.length]}%` }} />
      ))}
    </div>
  );
}

function ResumeMock({ accent, layout, serif = false }: { accent: string; layout: MockLayout; serif?: boolean }) {
  const side = (
    <div className="w-[34%] shrink-0 rounded-l-[6px] p-2.5 space-y-2.5" style={{ background: accent }}>
      <div className="mx-auto h-8 w-8 rounded-full bg-white/85" />
      <Lines n={3} light />
      <div className="h-[4px] w-[70%] rounded-full bg-white/80" />
      <Lines n={4} light />
    </div>
  );
  const main = (
    <div className="flex-1 p-2.5 space-y-2.5 bg-white">
      {layout === "single" && (
        <div className="space-y-1">
          <div className={`h-[7px] w-[62%] rounded-sm ${serif ? "rounded-none" : ""}`} style={{ background: accent }} />
          <div className="h-[3px] w-[44%] rounded-full bg-[#D9D9E4]" />
        </div>
      )}
      <div className="h-[4px] w-[36%] rounded-full" style={{ background: accent }} />
      <Lines n={4} />
      <div className="h-[4px] w-[42%] rounded-full" style={{ background: accent }} />
      <Lines n={3} />
      <div className="flex gap-1 pt-0.5">
        {[28, 22, 30].map((w, i) => (
          <div key={i} className="h-[7px] rounded-full" style={{ width: w, background: `${accent}22`, border: `1px solid ${accent}55` }} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="aspect-[1/1.414] w-full overflow-hidden rounded-[6px] border border-line bg-white shadow-[0_10px_34px_rgba(17,24,39,0.1)] flex">
      {layout === "left" && side}
      {main}
      {layout === "right" && side}
    </div>
  );
}

const GALLERY: { name: string; accent: string; layout: MockLayout; serif?: boolean }[] = [
  { name: "Crisp", accent: "#111827", layout: "single" },
  { name: "Aurora", accent: "#5B4BFF", layout: "left" },
  { name: "Forest", accent: "#16A34A", layout: "right" },
  { name: "Classic", accent: "#374151", layout: "single", serif: true },
  { name: "Crimson", accent: "#DC2626", layout: "left" },
  { name: "Ocean", accent: "#0284C7", layout: "single" },
  { name: "Royal", accent: "#7C3AED", layout: "right" },
  { name: "Amber", accent: "#D97706", layout: "left" },
];

/* ---------------- page sections ---------------- */

const STEPS = [
  { Icon: LayoutGrid, title: "Pick a template", body: "26 designs — clean ATS text layouts recruiters' software loves, or visual themes with photo and sidebars." },
  { Icon: FileText, title: "Your profile fills it in", body: "Name, experience, education and skills flow in automatically from your profile — or upload an old resume and AI fills everything." },
  { Icon: Palette, title: "Make it yours", body: "Switch accent colors, fonts and photo, and drag the text-size slider until everything sits on one page." },
  { Icon: WandSparkles, title: "Polish with AI", body: "One tap enhances your summary and headline — sharper wording, same facts. Check your ATS score against any job." },
  { Icon: Download, title: "Download a true PDF", body: "A real, selectable-text A4 PDF — not a screenshot — so employer software reads every word." },
];

const FEATURES = [
  {
    Icon: Gauge,
    title: "ATS-friendly by design",
    body: "Most rejections happen before a human ever reads your resume. Our text templates are single-column and machine-readable, and every download is a true text PDF — so applicant tracking systems parse your details correctly the first time.",
    points: ["Single-column ATS layouts", "Selectable-text PDF, never an image", "One-page discipline built in"],
  },
  {
    Icon: Bot,
    title: "AI that improves your words — not your facts",
    body: "Write your summary the way you'd say it, then let AI make it professional. It never invents experience, employers or skills; it sharpens what's already true. Pair it with the ATS Score Checker before you apply.",
    points: ["Enhance summary & headline in one tap", "Fill your profile from an uploaded resume", "Free ATS score against any job description"],
  },
  {
    Icon: IndianRupee,
    title: "Free. Actually free.",
    body: "Other portals charge thousands of rupees for resume writing services. Here the builder, the templates, the AI polish and the PDF downloads are all included with your free account — because a good resume shouldn't be a paid upgrade.",
    points: ["No watermarks, no locked templates", "Unlimited downloads", "Keep up to 5 resume versions on your profile"],
  },
];

const RESUME_FAQS = [
  { q: "Is the resume maker really free?", a: "Yes. Templates, AI enhancement, ATS checks and PDF downloads are all free with your account — no watermarks, no premium template wall, no per-download charges." },
  { q: "Will my resume pass ATS software?", a: "The Text (ATS) templates are single-column, machine-readable layouts, and every download is a genuine text-based PDF rather than an image — the two things applicant tracking systems care about most." },
  { q: "Can it fill my details automatically?", a: "Yes, two ways: your privatecareerjob profile flows straight into any template, or upload an existing resume PDF and AI extracts your experience, education and skills into your profile for review." },
  { q: "What does the AI actually change?", a: "Only the wording. The enhance buttons rewrite your summary or headline for clarity and impact but never add skills, employers, numbers or years you didn't state." },
  { q: "What format do I get?", a: "A one-page A4 PDF with real selectable text, named after you and ready to attach to applications on any portal." },
];

export function ResumeMakerPage() {
  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden px-5 pt-16 pb-20 sm:px-6 sm:pt-24">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(700px_300px_at_30%_0%,rgba(91,75,255,0.14),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Free resume maker</p>
            <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-black leading-[1.0] tracking-[-0.055em]">
              Make a resume that gets you hired.{" "}
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">In minutes, free.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-2">
              Pick a template, let your profile fill it in, polish the wording with AI, and download a true ATS-friendly PDF. No watermarks, no paid unlocks — ever.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard/resume">Create your resume — free</ButtonLink>
              <ButtonLink href="#templates" variant="secondary">Browse templates</ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-ink-2">
              {["26 templates", "ATS-friendly PDF", "AI polish included"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> {t}</span>
              ))}
            </div>
          </div>
          {/* collage */}
          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute inset-[-40px] rounded-full bg-[radial-gradient(circle,rgba(91,75,255,0.2),rgba(245,158,11,0.14),transparent_65%)] blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="rotate-[-4deg] mt-8">
                <ResumeMock accent="#5B4BFF" layout="left" />
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="rotate-[3deg]">
                <ResumeMock accent="#111827" layout="single" />
              </motion.div>
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-[12.5px] font-extrabold text-brand shadow-[0_14px_44px_rgba(91,75,255,0.2)] backdrop-blur">
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" /> AI fills & polishes it for you
            </div>
          </div>
        </div>
      </section>

      {/* template gallery */}
      <section id="templates" className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <SectionHeading eyebrow="Templates" title="Start with a template that fits the job" subtitle="Clean single-column layouts for employer software, or visual themes with photo and sidebar — every one tuned to fit a single A4 page." />
          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {GALLERY.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}>
                <Link href="/dashboard/resume" className="group block">
                  <div className="rounded-[10px] p-1 border-2 border-transparent transition group-hover:border-brand/50 group-hover:-translate-y-1">
                    <ResumeMock accent={t.accent} layout={t.layout} serif={t.serif} />
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1">
                    <p className="text-sm font-extrabold">{t.name}</p>
                    <span className="text-[12px] font-extrabold text-brand opacity-0 transition group-hover:opacity-100">Use this →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link href="/dashboard/resume" className="inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:text-brand-pressed">
              See all 26 templates in the builder <ArrowRight className="h-4 w-4" />
            </Link>
          </p>
        </div>
      </section>

      {/* how to */}
      <section className="bg-gradient-to-b from-[#f8f6ff] to-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-6">
          <SectionHeading eyebrow="How it works" title="How to make a resume in 5 steps" subtitle="From blank page to a recruiter-ready PDF in a few minutes — most of it happens automatically." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: i * 0.07, duration: 0.5 }} className="rounded-[1.35rem] border border-line bg-white p-5 shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white text-sm font-extrabold">{i + 1}</span>
                  <s.Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="mt-4 text-[15px] font-extrabold tracking-[-0.02em]">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-ink-2">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* feature rows */}
      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-[1180px] space-y-16 px-5 sm:px-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55 }} className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tonal text-brand"><f.Icon className="h-6 w-6" /></span>
                <h2 className="mt-5 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight tracking-[-0.04em]">{f.title}</h2>
                <p className="mt-4 max-w-xl leading-7 text-ink-2">{f.body}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm font-bold text-ink">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mx-auto w-full max-w-[380px]">
                <div className="absolute inset-[-30px] rounded-full bg-[radial-gradient(circle,rgba(91,75,255,0.14),transparent_65%)] blur-2xl" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="rotate-[-2deg]"><ResumeMock accent={["#5B4BFF", "#16A34A", "#D97706"][i]} layout={i % 2 ? "single" : "left"} /></div>
                  <div className="rotate-[2deg] mt-6"><ResumeMock accent={["#111827", "#0284C7", "#7C3AED"][i]} layout={i % 2 ? "right" : "single"} /></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <FAQSection items={RESUME_FAQS} subtitle="Everything people ask before making their resume here." />
      <CTASection />
    </>
  );
}
