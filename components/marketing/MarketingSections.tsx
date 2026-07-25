"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  Globe2,
  LineChart,
  Map,
  MessageCircle,
  MessageSquareText,
  Mic2,
  Radar,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UsersRound,
  WandSparkles,
  Workflow,
} from "lucide-react";

type IconType = typeof ShieldCheck;

type Feature = { icon: IconType; title: string; body: string };
type AiTool = Feature & { badge: string; cta: string };

type HeroProps = {
  eyebrow: string;
  title: string;
  gradient: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  visual?: "phone" | "pipeline" | "ai" | "contact";
};

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

export const seekerFeatures: Feature[] = [
  { icon: ShieldCheck, title: "Verified Jobs", body: "Every company is verified before roles go live, so seekers avoid fake listings and fees." },
  { icon: Workflow, title: "Application Timeline", body: "Track Applied, Viewed, Shortlisted, Interview, Offer, and Hired in one clean flow." },
  { icon: MessageCircle, title: "Recruiter Chat", body: "Message employers directly after applying and keep documents, updates, and interviews together." },
  { icon: FileText, title: "Resume Builder", body: "Build an ATS-friendly resume from your profile with polished templates made for fast applying." },
  { icon: Globe2, title: "Public Profile", body: "Claim a shareable candidate page with templates, fonts, photos, and your latest experience." },
  { icon: Bell, title: "Instant Alerts", body: "Know when a recruiter views, shortlists, messages, or moves your application forward." },
];

export const recruiterFeatures: Feature[] = [
  { icon: BriefcaseBusiness, title: "Fast Job Posting", body: "Publish roles with salary bands, shifts, screening questions, and structured requirements." },
  { icon: UsersRound, title: "Candidate Pipeline", body: "Move applicants from new lead to shortlisted, interview, offer, and hired without spreadsheets." },
  { icon: MessageSquareText, title: "Recruiter Chat", body: "Keep conversations, files, interview context, and follow-ups attached to the candidate." },
  { icon: SearchCheck, title: "Shortlist Workflows", body: "Review signals, compare profiles, and keep the hiring team aligned on next steps." },
  { icon: LineChart, title: "Hiring Analytics", body: "See active jobs, applications, shortlist rates, and candidate flow in a focused dashboard." },
  { icon: Bot, title: "Recruiter AI Previews", body: "Showcase upcoming assistant workflows for summaries, job descriptions, and candidate signals." },
];

export const aiTools: AiTool[] = [
  { icon: FileText, title: "AI Resume Builder", body: "Build a polished, ATS-friendly resume from your profile — free, unlike paid resume services.", badge: "Live", cta: "Sign in to use" },
  { icon: WandSparkles, title: "AI Resume Optimizer", body: "Honest feedback, line-by-line rewrites, and a headline recruiters stop for.", badge: "Live", cta: "Sign in to use" },
  { icon: Gauge, title: "AI ATS Score Checker", body: "Score your resume against a real job description before you apply.", badge: "Live", cta: "Sign in to use" },
  { icon: Mic2, title: "AI Interview Coach", body: "Mock HR, technical, and English-practice rounds with feedback on every answer.", badge: "Live", cta: "Sign in to use" },
  { icon: Radar, title: "AI Job Match Assistant", body: "An honest role-fit check plus a ready-to-send note for the recruiter.", badge: "Live", cta: "Sign in to use" },
  { icon: UserCheck, title: "AI Profile Optimizer", body: "Keywords, headline, and summary tuned for how recruiters actually search.", badge: "Live", cta: "Sign in to use" },
  { icon: TrendingUp, title: "AI Salary Estimator", body: "Realistic CTC ranges for your role and city — with monthly in-hand, not just CTC.", badge: "Live", cta: "Sign in to use" },
  { icon: Map, title: "AI Career Roadmap", body: "Skill gaps and a practical step-by-step plan to the role you want next.", badge: "Live", cta: "Sign in to use" },
  { icon: Bot, title: "AI Recruiter Assistant", body: "Help hiring teams summarize candidate signals and next actions.", badge: "Recruiter", cta: "Coming soon" },
  { icon: ClipboardCheck, title: "AI Job Description Generator", body: "Create clear, structured job descriptions for hiring teams.", badge: "Recruiter", cta: "Coming soon" },
];

const comparisons = ["Verified Employers", "Live Application Tracking", "Public Candidate Profile", "Built-in Resume", "Recruiter Chat", "AI Career Tools", "Modern Dashboard"];

const faqs = [
  { q: "Are the AI tools functional on the marketing pages?", a: "No. These pages only showcase premium AI previews. Every AI card clearly asks users to sign in or notes that the feature is available after login." },
  { q: "Is PrivateCareerJob free to join?", a: "Yes. Job seekers and recruiters can create an account quickly, then use the role-specific dashboard built for their workflow." },
  { q: "How does application tracking work?", a: "Applications move through clear stages such as Applied, Viewed, Shortlisted, Interview, Offer, and Hired, so candidates know where they stand." },
  { q: "Can recruiters manage the full hiring pipeline?", a: "Yes. Recruiters can post jobs, review candidates, shortlist applicants, schedule interviews, send offers, and chat with candidates." },
];

const testimonials = [
  { name: "Aarav Mehta", role: "Operations Associate", review: "The application timeline makes the process feel transparent. I know exactly when a recruiter has viewed my profile." },
  { name: "Nisha Rao", role: "HR Manager", review: "The pipeline view keeps our hiring team aligned without spreadsheets. It feels much lighter than old job portals." },
  { name: "Kabir Sethi", role: "Sales Executive", review: "Verified jobs and instant alerts save time. The profile page also gives me one clean link to share." },
  { name: "Maya Iyer", role: "Recruiter", review: "Candidate chat and live stages reduce back-and-forth. We can move faster without losing context." },
];

export function SectionHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle: string }) {
  return (
    <motion.div className="mx-auto max-w-3xl text-center" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      {eyebrow ? <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">{eyebrow}</p> : null}
      <h2 className="text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-[1.03] tracking-[-0.055em] text-ink">{title}</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-2 sm:text-lg">{subtitle}</p>
    </motion.div>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "light" }) {
  const classes = {
    primary: "bg-accent text-ink shadow-[0_18px_45px_rgba(245,158,11,0.26)] hover:bg-accent-pressed",
    secondary: "border border-brand/20 bg-white/70 text-brand shadow-[0_18px_45px_rgba(91,75,255,0.08)] hover:border-brand/35 hover:bg-brand-tonal",
    light: "bg-white text-ink shadow-[0_20px_60px_rgba(17,24,39,0.18)] hover:bg-[#fff8ec]",
  }[variant];
  return <Link href={href} className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:px-6 ${classes}`}>{children}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>;
}

function PhoneVisual() {
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const stages = ["Application Sent", "Viewed", "Shortlisted", "Interview", "Offer"];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => setActive((value) => (value + 1) % stages.length), 1800);
    return () => window.clearInterval(interval);
  }, [reduceMotion, stages.length]);

  useEffect(() => {
    if (reduceMotion || !phoneRef.current) return;
    const tween = gsap.to(phoneRef.current, { y: -14, rotate: 1.2, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true });
    return () => { tween.kill(); };
  }, [reduceMotion]);

  return (
    <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[390px]">
      <div className="absolute inset-[-42px] rounded-full bg-[radial-gradient(circle,rgba(91,75,255,0.32),rgba(245,158,11,0.2)_34%,transparent_68%)] blur-2xl" />
      <div ref={phoneRef} className="relative rounded-[3rem] border border-white/60 bg-ink p-2 shadow-[0_35px_90px_rgba(17,24,39,0.24)]">
        <div className="overflow-hidden rounded-[2.45rem] bg-[#fbfbff]">
          <div className="mx-auto mt-3 h-6 w-28 rounded-full bg-ink" />
          <div className="px-5 pb-6 pt-4">
            <div className="rounded-[1.6rem] border border-line bg-white p-4 shadow-[0_18px_45px_rgba(17,24,39,0.08)]">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-3">Live status</p><h3 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">Product Ops Associate</h3></div><span className="rounded-full bg-brand-tonal px-3 py-1 text-xs font-extrabold text-brand">Verified</span></div>
              <div className="mt-5 space-y-3">
                {stages.map((stage, index) => {
                  const complete = index <= active;
                  return <div key={stage} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full border ${complete ? "border-brand bg-brand text-white" : "border-line bg-sunken text-ink-3"}`}>{complete ? <Check className="h-4 w-4" /> : index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className={`text-sm font-extrabold ${complete ? "text-ink" : "text-ink-3"}`}>{stage}</p>{index === active ? <span className="text-[11px] font-bold text-accent-pressed">Now</span> : null}</div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" animate={{ width: complete ? "100%" : "0%" }} transition={{ duration: 0.55 }} /></div></div></div>;
                })}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-line bg-white p-3"><p className="text-[11px] font-bold text-ink-3">Recruiter</p><p className="mt-1 text-sm font-extrabold">Message ready</p></div><div className="rounded-2xl border border-line bg-white p-3"><p className="text-[11px] font-bold text-ink-3">Profile</p><p className="mt-1 text-sm font-extrabold">92% complete</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroVisual({ visual }: { visual?: HeroProps["visual"] }) {
  if (visual === "phone") return <PhoneVisual />;
  if (visual === "ai") return <AiPreview compact />;
  if (visual === "pipeline") return <PipelineCard />;
  return <ContactCard />;
}

export function PageHero({ eyebrow, title, gradient, body, primary, secondary, visual = "phone" }: HeroProps) {
  return (
    <header className="relative overflow-hidden pb-14 pt-10 sm:pb-18 sm:pt-20 lg:pb-24">
      <div className="aurora-bg absolute inset-x-0 top-[-180px] h-[620px] opacity-80" />
      <div className="float-blob absolute left-[5%] top-20 h-40 w-40 rounded-full bg-brand/18 blur-3xl" />
      <div className="float-blob-delayed absolute right-[8%] top-52 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1180px] items-center gap-9 px-5 sm:gap-10 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:gap-12">
        <motion.div className="text-center lg:text-left" initial="hidden" animate="visible" variants={stagger}>
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/70 px-3.5 py-2 text-[11px] font-extrabold uppercase leading-tight tracking-[0.12em] text-brand shadow-[0_12px_35px_rgba(91,75,255,0.08)] backdrop-blur-xl sm:px-4 sm:text-xs sm:tracking-[0.14em]"><Sparkles className="h-4 w-4 shrink-0" /> {eyebrow}</motion.span>
          <motion.h1 variants={fadeUp} className="mt-5 text-balance break-words text-[clamp(2.25rem,8vw,4.25rem)] font-black leading-[1.02] tracking-[-0.05em] text-ink sm:mt-6 sm:leading-[0.98] sm:tracking-[-0.06em]">{title}<span className="animated-gradient-text mt-1 block bg-gradient-to-r from-brand via-[#8f7cff] to-accent bg-clip-text text-transparent">{gradient}</span></motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-ink-2 sm:mt-6 sm:max-w-2xl sm:text-lg sm:leading-8 lg:mx-0 lg:text-xl">{body}</motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center lg:justify-start"><ButtonLink href={primary.href}>{primary.label}</ButtonLink>{secondary ? <ButtonLink href={secondary.href} variant="secondary">{secondary.label}</ButtonLink> : null}</motion.div>
        </motion.div>
        <HeroVisual visual={visual} />
      </div>
    </header>
  );
}

export function Metrics() {
  return <motion.section className="mx-auto max-w-[1180px] px-5 sm:px-6" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} aria-label="Platform trust metrics"><div className="grid gap-4 sm:grid-cols-3"><CounterCard value={100} suffix="%" label="verified employers" /><CounterCard value="Live" label="application status updates" /><CounterCard value="2-in-1" label="seekers and recruiters, one app" /></div></motion.section>;
}

function CounterCard({ value, label, suffix = "" }: { value: number | string; label: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (!isInView || typeof value !== "number" || reduceMotion) return;
    let frame = 0;
    const total = 42;
    const id = window.setInterval(() => { frame += 1; setCount(Math.round((value * frame) / total)); if (frame >= total) window.clearInterval(id); }, 24);
    return () => window.clearInterval(id);
  }, [isInView, reduceMotion, value]);
  return <motion.div ref={ref} className="group rounded-[1.5rem] border border-white/70 bg-white/75 p-6 text-center shadow-[0_20px_55px_rgba(91,75,255,0.08)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(91,75,255,0.14)]" variants={fadeUp}><b className="block bg-gradient-to-r from-brand via-[#8b7cff] to-accent bg-clip-text text-4xl font-extrabold tracking-[-0.05em] text-transparent">{typeof value === "number" ? (reduceMotion && isInView ? value : count) : value}{suffix}</b><span className="mt-2 block text-sm font-bold text-ink-2">{label}</span></motion.div>;
}

export function FeatureGrid({ heading, subtitle, features, tone = "purple" }: { heading: string; subtitle: string; features: Feature[]; tone?: "purple" | "white" }) {
  return <section className={`relative py-24 sm:py-28 ${tone === "purple" ? "bg-[#f7f4ff]" : "bg-white"}`}><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title={heading} subtitle={subtitle} /><motion.div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>{features.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</motion.div></div></section>;
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return <motion.article variants={fadeUp} whileHover={{ y: -8, rotateX: 2, rotateY: -2 }} transition={{ duration: 0.25 }} className="group rounded-[1.5rem] border border-line/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(17,24,39,0.06)] backdrop-blur-xl"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-tonal text-brand transition duration-300 group-hover:rotate-3 group-hover:scale-105"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-ink">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-ink-2">{feature.body}</p></motion.article>;
}

export function AiPreview({ compact = false }: { compact?: boolean }) {
  return <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}><motion.div variants={fadeUp} className="rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_80px_rgba(91,75,255,0.12)] backdrop-blur-xl"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white"><FileText className="h-5 w-5" /></span><div><h3 className="font-extrabold tracking-[-0.03em]">AI Resume Builder</h3><p className="text-xs font-bold text-ink-3">Static preview</p></div></div><span className="rounded-full bg-[#fff4dc] px-3 py-1 text-xs font-extrabold text-accent-pressed">Premium</span></div><div className="mt-5 space-y-4 rounded-[1.35rem] border border-line bg-white p-4"><p className="text-sm font-bold text-ink-2">Uploading Resume...</p><div className="h-2 overflow-hidden rounded-full bg-sunken"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" initial={{ width: "22%" }} whileInView={{ width: "82%" }} viewport={{ once: true }} transition={{ duration: 1.4 }} /></div><p className="text-sm font-bold text-ink-2">Analyzing...</p><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-brand-tonal p-4"><p className="text-xs font-bold text-brand">ATS Score</p><b className="mt-1 block text-3xl font-extrabold">89</b></div><div className="rounded-2xl bg-[#fff4dc] p-4"><p className="text-xs font-bold text-accent-pressed">Improvements Found</p><b className="mt-1 block text-3xl font-extrabold">12</b></div></div><ButtonLink href="/dashboard">Sign in to use</ButtonLink></div></motion.div>{compact ? null : <motion.div variants={fadeUp} className="rounded-[1.75rem] border border-white/70 bg-[#171329] p-5 text-white shadow-[0_24px_80px_rgba(17,24,39,0.18)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><Mic2 className="h-5 w-5" /></span><div><h3 className="font-extrabold tracking-[-0.03em]">Interview Coach</h3><p className="text-xs font-bold text-white/50">Static preview</p></div></div><div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-4"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent">AI</p><p className="mt-2 text-sm text-white/82">Tell me about yourself.</p><div className="mt-5 space-y-3">{[["Communication", "91%"], ["Confidence", "87%"]].map(([label, score]) => <div key={label}><div className="mb-1 flex justify-between text-xs font-bold text-white/70"><span>{label}</span><span>{score}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-brand" initial={{ width: "35%" }} whileInView={{ width: score }} viewport={{ once: true }} transition={{ duration: 1.2 }} /></div></div>)}</div><Link href="/dashboard" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-extrabold text-ink transition hover:-translate-y-0.5">Sign in to use</Link></div></motion.div>}</div>;
}

export function AiToolsGrid({ withPreview = true }: { withPreview?: boolean }) {
  return <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f8f6ff] to-white py-24 sm:py-28"><div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(650px_260px_at_50%_0%,rgba(91,75,255,0.16),transparent_70%)]" /><div className="relative mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading eyebrow="Upcoming premium features" title="Meet Your AI Career Copilot" subtitle="AI-powered tools designed to help you get hired faster. These previews are static showcases and become available only after authentication." />{withPreview ? <motion.div className="mt-12" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}><AiPreview /></motion.div> : null}<motion.div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>{aiTools.map((tool, index) => <AiToolCard key={tool.title} tool={tool} index={index} />)}</motion.div></div></section>;
}

function AiToolCard({ tool, index }: { tool: AiTool; index: number }) {
  const Icon = tool.icon;
  return <motion.article variants={fadeUp} whileHover={{ y: -8 }} animate={{ y: [0, index % 2 ? -4 : 4, 0] }} transition={{ y: { duration: 5 + (index % 3), repeat: Infinity, ease: "easeInOut" } }} className="group relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-[0_18px_70px_rgba(91,75,255,0.08)] backdrop-blur-xl"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent opacity-70" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(91,75,255,0.12),transparent_48%)] opacity-0 transition group-hover:opacity-100" /><div className="relative"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-tonal text-brand shadow-inner"><Icon className="h-5 w-5" /></span><span className="rounded-full border border-brand/15 bg-white/75 px-2.5 py-1 text-[11px] font-extrabold text-brand">{tool.badge}</span></div><h3 className="mt-5 text-base font-extrabold tracking-[-0.03em]">{tool.title}</h3><p className="mt-2 min-h-[72px] text-sm leading-6 text-ink-2">{tool.body}</p><Link href="/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-brand hover:text-brand-pressed">{tool.cta}<ArrowRight className="h-4 w-4" /></Link></div></motion.article>;
}

function PipelineCard() {
  const steps = ["Job Posted", "Candidates", "Shortlisted", "Interview", "Offer", "Hired"];
  return <div className="relative mx-auto w-full max-w-[440px] rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_30px_90px_rgba(91,75,255,0.14)] backdrop-blur-xl"><div className="absolute inset-[-40px] rounded-full bg-[radial-gradient(circle,rgba(91,75,255,0.22),rgba(245,158,11,0.16),transparent_65%)] blur-3xl" /><div className="relative space-y-3">{steps.map((step, index) => <div key={step} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-tonal text-sm font-extrabold text-brand">{index + 1}</span><span className="font-extrabold">{step}</span><div className="ml-auto h-2 w-16 overflow-hidden rounded-full bg-sunken"><motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" initial={{ width: 0 }} whileInView={{ width: `${100 - index * 9}%` }} viewport={{ once: true }} /></div></div>)}</div></div>;
}

export function RecruiterPipeline() {
  const steps = [[BriefcaseBusiness, "Job Posted"], [UsersRound, "Candidates"], [SearchCheck, "Shortlisted"], [MessageSquareText, "Interview"], [FileCheck2, "Offer"], [BadgeCheck, "Hired"]] as const;
  return <section className="bg-white py-16 sm:py-24 lg:py-28"><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title="A hiring pipeline that moves" subtitle="Post a job in minutes and move candidates through a clear, modern flow without clunky portals or spreadsheets." /><motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-90px" }} className="mx-auto mt-10 grid max-w-md gap-3 sm:gap-4 md:mt-12 md:max-w-none md:grid-cols-6">{steps.map(([Icon, label], index) => <motion.div key={label} variants={fadeUp} className="relative flex items-center gap-4 rounded-[1.35rem] border border-line bg-white p-4 shadow-[0_18px_50px_rgba(17,24,39,0.06)] md:block">{index < steps.length - 1 ? <div className="absolute left-1/2 top-full hidden h-3 w-px -translate-x-1/2 bg-gradient-to-b from-brand/40 to-transparent sm:block md:left-full md:top-1/2 md:h-px md:w-4 md:-translate-x-0 md:-translate-y-1/2" /> : null}<span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-tonal text-brand"><Icon className="h-5 w-5" /></span><p className="text-sm font-extrabold tracking-[-0.02em] md:mt-4">{label}</p></motion.div>)}</motion.div></div></section>;
}

export function Comparison() {
  return <section className="bg-[#f7f4ff] py-24 sm:py-28"><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title="PrivateCareerJob vs Traditional Job Portals" subtitle="A cleaner way to apply, hire, communicate, and track progress without losing context." /><div className="mt-12 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/75 shadow-[0_24px_80px_rgba(91,75,255,0.1)] backdrop-blur-xl"><div className="grid grid-cols-[1.2fr_0.8fr_0.8fr] border-b border-line bg-white/70 px-4 py-4 text-sm font-extrabold text-ink sm:px-6"><span>Feature</span><span>PrivateCareerJob</span><span>Traditional portals</span></div>{comparisons.map((item) => <div key={item} className="grid grid-cols-[1.2fr_0.8fr_0.8fr] items-center border-b border-line/80 px-4 py-4 text-sm last:border-b-0 sm:px-6"><span className="font-bold text-ink">{item}</span><span><Check className="h-5 w-5 text-brand" /></span><span className="text-ink-3">Limited</span></div>)}</div></div></section>;
}

export function Testimonials() {
  const duplicated = useMemo(() => [...testimonials, ...testimonials], []);
  return <section className="overflow-hidden bg-white py-24 sm:py-28"><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title="Built for seekers and hiring teams" subtitle="A premium experience for the people applying and the teams making decisions." /></div><div className="testimonial-track mt-12 flex gap-5 px-5">{duplicated.map((item, index) => <article key={`${item.name}-${index}`} className="w-[310px] shrink-0 rounded-[1.5rem] border border-line bg-white/80 p-5 shadow-[0_18px_60px_rgba(17,24,39,0.07)] backdrop-blur-xl sm:w-[380px]"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-extrabold text-white">{item.name.split(" ").map((part) => part[0]).join("")}</div><div><h3 className="font-extrabold">{item.name}</h3><p className="text-sm text-ink-2">{item.role}</p></div></div><div className="mt-4 flex gap-1 text-accent" aria-label="5 star review">{Array.from({ length: 5 }).map((_, star) => <Star key={star} className="h-4 w-4 fill-current" />)}</div><p className="mt-4 text-sm leading-6 text-ink-2">{item.review}</p></article>)}</div></section>;
}

export function FAQSection({ items = faqs, subtitle = "Clear answers for job seekers and recruiters before they create an account." }: { items?: { q: string; a: string }[]; subtitle?: string }) {
  const [open, setOpen] = useState(0);
  return <section className="bg-gradient-to-b from-[#f8f6ff] to-white py-24 sm:py-28"><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title="Questions, answered" subtitle={subtitle} /><div className="mx-auto mt-11 max-w-3xl divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-[0_20px_70px_rgba(17,24,39,0.06)]">{items.map((item, index) => <div key={item.q}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-extrabold text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:px-6" aria-expanded={open === index}>{item.q}<ChevronDown className={`h-5 w-5 shrink-0 text-brand transition-transform ${open === index ? "rotate-180" : ""}`} /></button><AnimatePresence initial={false}>{open === index ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }}><p className="px-5 pb-5 leading-7 text-ink-2 sm:px-6">{item.a}</p></motion.div> : null}</AnimatePresence></div>)}</div></div></section>;
}

function ContactCard() {
  return <div className="relative mx-auto w-full max-w-[430px] rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(91,75,255,0.14)] backdrop-blur-xl"><div className="grid gap-4"><div className="rounded-2xl bg-brand-tonal p-5"><p className="text-sm font-extrabold text-brand">Support</p><p className="mt-2 break-words text-xl font-black tracking-[-0.04em] sm:text-2xl sm:tracking-[-0.05em]">support@privatecareerjob.com</p></div><div className="rounded-2xl border border-line bg-white p-5"><p className="text-sm font-extrabold text-ink-3">Response window</p><p className="mt-2 text-lg font-extrabold">Business days</p></div></div></div>;
}

export function CTASection() {
  return <section className="px-5 py-10 sm:px-6 sm:py-14"><div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-[#7668ff] to-[#201946] px-5 py-16 text-center text-white shadow-[0_35px_100px_rgba(91,75,255,0.24)] sm:px-8 sm:py-20"><div className="absolute inset-0 bg-[radial-gradient(500px_220px_at_20%_20%,rgba(245,158,11,0.38),transparent_70%),radial-gradient(500px_280px_at_80%_0%,rgba(255,255,255,0.22),transparent_65%)]" /><div className="relative mx-auto max-w-3xl"><h2 className="text-[clamp(2.2rem,6vw,4.8rem)] font-black leading-[0.98] tracking-[-0.065em]">Ready to land your next opportunity?</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/78">Create your account and move into a modern dashboard built for verified jobs, live tracking, and faster hiring.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href="/signup?role=seeker" variant="light">Create Job Seeker Account</ButtonLink><ButtonLink href="/signup?role=recruiter" variant="light">Create Recruiter Account</ButtonLink></div></div></div></section>;
}

export function ResourceCards() {
  const cards = [
    { title: "Application tracking guide", body: "Understand each status and how to follow up with recruiters professionally.", href: "/job-seekers" },
    { title: "Resume readiness checklist", body: "Structure your experience, skills, and public profile before applying.", href: "/job-seekers" },
    { title: "Hiring pipeline playbook", body: "Move from job post to hired with fewer dropped candidates and cleaner context.", href: "/recruiters" },
    { title: "AI tools preview", body: "Explore upcoming premium AI features without any working AI on the public site.", href: "/ai-tools" },
  ];
  return <section className="bg-white py-24 sm:py-28"><div className="mx-auto max-w-[1180px] px-5 sm:px-6"><SectionHeading title="Resources for modern hiring" subtitle="Practical starting points for job seekers and recruiting teams." /><div className="mt-12 grid gap-5 md:grid-cols-2">{cards.map((card) => <Link key={card.title} href={card.href} className="group rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_18px_60px_rgba(17,24,39,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(91,75,255,0.12)]"><h3 className="text-xl font-extrabold tracking-[-0.04em]">{card.title}</h3><p className="mt-2 text-sm leading-6 text-ink-2">{card.body}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-brand">Read more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div></div></section>;
}
