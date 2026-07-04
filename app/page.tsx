import Link from "next/link";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-ink">
      <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
      privatesectorjob
    </Link>
  );
}

const seekerCards = [
  { icon: "🛡️", title: "Verified jobs only", body: "Every company is verified before their jobs go live. No scams, no fake listings, no fees to apply." },
  { icon: "📊", title: "Application dashboard", body: "Swipe through Applied · Viewed · Shortlisted · Interview · Offer · Hired. Response rates and weekly momentum included." },
  { icon: "💬", title: "Chat with employers", body: "Message recruiters directly once you've applied — share documents, confirm interviews, get answers fast." },
  { icon: "📄", title: "Resume builder", body: "Build an ATS-friendly resume from your profile with six polished templates. No Word wrestling." },
  { icon: "🌐", title: "Your own webpage", body: "Claim privatesectorjob.com/@yourname — a personal page with templates, fonts and photos you control." },
  { icon: "🔔", title: "Instant alerts", body: "Know the second you're shortlisted or a recruiter messages you. Nothing slips through." },
];

const recruiterCards = [
  { icon: "📣", title: "Post jobs in minutes", body: "Salary bands, shifts, custom screening questions — publish to thousands of active seekers instantly." },
  { icon: "🗂️", title: "Candidate pipeline", body: "Shortlist, schedule interviews, extend offers. Candidates see updates live — fewer no-shows, faster closes." },
  { icon: "📈", title: "Hiring analytics", body: "Active jobs, applications today, shortlist counts — the dashboard tells you what's working." },
];

export default function Landing() {
  return (
    <div>
      {/* nav */}
      <nav className="sticky top-0 z-50 bg-paper/85 backdrop-blur-md border-b border-line">
        <div className="max-w-[1080px] mx-auto px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-5">
            <a href="#seekers" className="hidden sm:block text-ink-2 hover:text-ink font-semibold text-[14.5px]">For job seekers</a>
            <a href="#recruiters" className="hidden sm:block text-ink-2 hover:text-ink font-semibold text-[14.5px]">For recruiters</a>
            <Link href="/dashboard" className="text-ink-2 hover:text-ink font-semibold text-[14.5px]">Sign in</Link>
            <Link href="/signup" className="inline-flex items-center min-h-10 px-4 rounded-xl bg-accent hover:bg-accent-pressed text-ink font-bold text-sm transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* hero */}
      <header className="relative overflow-hidden text-center pt-24 pb-16">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(600px_320px_at_50%_20%,rgba(91,75,255,0.14),transparent_65%)]" />
        <div className="relative max-w-[1080px] mx-auto px-6">
          <span className="rise inline-flex items-center gap-2 bg-brand-tonal text-brand px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide">
            ✦ Verified jobs · Real-time application tracking
          </span>
          <h1 className="rise-1 mt-6 mx-auto max-w-[800px] text-[clamp(34px,6vw,58px)] leading-[1.12] font-extrabold tracking-[-1.2px]">
            The job platform India deserves —{" "}
            <span className="bg-gradient-to-r from-brand to-[#9A8CFF] bg-clip-text text-transparent">premium for both sides.</span>
          </h1>
          <p className="rise-2 mt-5 mx-auto max-w-[620px] text-ink-2 text-[clamp(16px,2.2vw,19px)]">
            Job seekers find verified openings and track every application live. Recruiters post jobs and run their whole
            hiring pipeline — all in one beautifully crafted app.
          </p>
          <div className="rise-3 mt-8 flex flex-wrap justify-center gap-3.5">
            <Link href="/signup?role=seeker" className="inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition-colors">
              I&apos;m looking for a job
            </Link>
            <Link href="/signup?role=recruiter" className="inline-flex items-center min-h-12 px-6 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold transition-colors">
              I&apos;m hiring
            </Link>
          </div>
          <p className="rise-3 mt-6 text-ink-3 text-[13.5px]">Free to join · Every employer verified · English &amp; हिन्दी</p>
        </div>
      </header>

      {/* stats */}
      <div className="max-w-[1080px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ["100%", "verified employers"],
            ["Live", "application status updates"],
            ["2-in-1", "seekers & recruiters, one app"],
          ].map(([b, s]) => (
            <div key={s} className="bg-white border border-line rounded-[20px] p-6 text-center">
              <b className="block text-[28px] font-extrabold text-brand tracking-[-0.5px]">{b}</b>
              <span className="text-ink-2 text-sm">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* seekers */}
      <section id="seekers" className="py-18">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="text-center font-extrabold tracking-[-0.7px] text-[clamp(26px,4vw,36px)]">
            Never wonder where your application went
          </h2>
          <p className="text-center text-ink-2 max-w-[560px] mx-auto mt-3">
            Apply and track everything in one place — from Applied to Hired, you see every move the moment it happens.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-11">
            {seekerCards.map((c) => (
              <div key={c.title} className="bg-white border border-line rounded-[20px] p-7 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,24,39,0.07)]">
                <div className="grid place-items-center w-[46px] h-[46px] rounded-[14px] bg-brand-tonal text-[22px]">{c.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-ink-2 text-[14.5px]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* recruiters */}
      <section id="recruiters" className="py-18 bg-white border-y border-line">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="text-center font-extrabold tracking-[-0.7px] text-[clamp(26px,4vw,36px)]">Hire from your pocket</h2>
          <p className="text-center text-ink-2 max-w-[560px] mx-auto mt-3">
            Post a job in minutes and move candidates through your pipeline — no clunky portals, no spreadsheets.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-11">
            {recruiterCards.map((c) => (
              <div key={c.title} className="bg-paper border border-line rounded-[20px] p-7 transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,24,39,0.07)]">
                <div className="grid place-items-center w-[46px] h-[46px] rounded-[14px] bg-brand-tonal text-[22px]">{c.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{c.title}</h3>
                <p className="mt-1.5 text-ink-2 text-[14.5px]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* personas */}
      <section className="py-18">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="text-center font-extrabold tracking-[-0.7px] text-[clamp(26px,4vw,36px)]">One account, the right experience</h2>
          <p className="text-center text-ink-2 max-w-[560px] mx-auto mt-3">Choose your side when you sign up — each gets a purpose-built experience.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-11">
            <div className="rounded-[20px] border border-line p-8 bg-gradient-to-br from-[#F6F5FF] to-white">
              <h3 className="text-[22px] font-extrabold tracking-[-0.3px]">For job seekers</h3>
              <ul className="my-4 space-y-1.5">
                {["Personalised feed of verified openings", "One-tap apply with your saved resume", "Live status on every application", "Public profile page to share anywhere"].map((li) => (
                  <li key={li} className="flex gap-2.5 text-ink-2 text-[15px]">
                    <span className="text-green-600 font-extrabold">✓</span>
                    {li}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=seeker" className="inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition-colors">
                Create seeker account
              </Link>
            </div>
            <div className="rounded-[20px] border border-line p-8 bg-gradient-to-br from-[#FFF8EC] to-white">
              <h3 className="text-[22px] font-extrabold tracking-[-0.3px]">For recruiters</h3>
              <ul className="my-4 space-y-1.5">
                {["Unlimited job posts with screening questions", "Full pipeline: shortlist → interview → hire", "Direct chat with applied candidates", "Dashboard metrics that matter"].map((li) => (
                  <li key={li} className="flex gap-2.5 text-ink-2 text-[15px]">
                    <span className="text-green-600 font-extrabold">✓</span>
                    {li}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=recruiter" className="inline-flex items-center min-h-12 px-6 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold transition-colors">
                Create recruiter account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="py-20 text-center text-white bg-gradient-to-br from-brand to-[#7A6CFF]">
        <div className="max-w-[1080px] mx-auto px-6">
          <h2 className="font-extrabold tracking-[-0.7px] text-[clamp(26px,4vw,38px)]">Your next chapter starts here</h2>
          <p className="mt-2.5 opacity-85">Join privatesectorjob today — it takes less than a minute.</p>
          <Link href="/signup" className="mt-7 inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition-colors">
            Get started free
          </Link>
        </div>
      </section>

      <footer className="py-9 text-center text-ink-3 text-[13.5px]">
        © {new Date().getFullYear()} privatesectorjob · Made in India 🇮🇳 ·{" "}
        <Link href="/signup" className="text-ink-2 hover:text-ink">Sign up</Link>
      </footer>
    </div>
  );
}
