"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import Lenis from "lenis";
import { ArrowRight, Mail, Menu, MessageCircle, UsersRound, X } from "lucide-react";

const navItems = [
  { href: "/job-seekers", label: "Job Seekers" },
  { href: "/recruiters", label: "Recruiters" },
  { href: "/resume-maker", label: "Resume Maker" },
  { href: "/ai-tools", label: "AI Tools" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5 font-extrabold text-lg text-ink" aria-label="PrivateCareerJob home">
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-brand text-[17px] text-white shadow-[0_12px_30px_rgba(91,75,255,0.28)] transition-transform group-hover:-translate-y-0.5">
        P
      </span>
      <span className="tracking-[-0.02em]">privatecareerjob</span>
    </Link>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [spotlight, setSpotlight] = useState({ x: 50, y: 10 });
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (reduceMotion) return;
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-paper text-ink"
      onMouseMove={(event) => setSpotlight({ x: (event.clientX / window.innerWidth) * 100, y: (event.clientY / window.innerHeight) * 100 })}
    >
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70" style={{ background: `radial-gradient(420px circle at ${spotlight.x}% ${spotlight.y}%, rgba(91,75,255,0.13), transparent 45%)` }} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(91,75,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(91,75,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

      <nav className="sticky top-0 z-50 border-b border-white/70 bg-paper/72 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-3 px-5 py-3 sm:px-6">
          <Logo />

          {/* Desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold transition ${active ? "bg-brand-tonal text-brand" : "text-ink-2 hover:bg-white/70 hover:text-ink"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/dashboard" className="text-sm font-bold text-ink-2 transition hover:text-ink">Sign in</Link>
            <Link href="/signup" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-extrabold text-ink shadow-[0_12px_28px_rgba(245,158,11,0.2)] transition hover:-translate-y-0.5 hover:bg-accent-pressed">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-white/70 text-ink transition hover:bg-white lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence initial={false}>
          {menuOpen ? (
            <motion.div
              id="mobile-menu"
              key="mobile-menu"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line/70 bg-paper/95 backdrop-blur-xl lg:hidden"
            >
              <div className="mx-auto flex max-w-[1180px] flex-col gap-1 px-5 py-4 sm:px-6">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-xl px-4 py-3 text-base font-bold transition ${active ? "bg-brand-tonal text-brand" : "text-ink-2 hover:bg-white/70 hover:text-ink"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="mt-2 flex flex-col gap-2 border-t border-line/70 pt-3">
                  <Link href="/dashboard" className="rounded-xl px-4 py-3 text-base font-bold text-ink-2 transition hover:bg-white/70 hover:text-ink">Sign in</Link>
                  <Link href="/signup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-base font-extrabold text-ink shadow-[0_12px_28px_rgba(245,158,11,0.2)] transition hover:bg-accent-pressed">
                    Get started <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </nav>

      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          className="relative z-10"
          initial={reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <footer className="relative z-10 border-t border-line bg-white px-5 py-12 sm:px-6">
        <div className="mx-auto grid max-w-[1180px] gap-10 md:grid-cols-[1.25fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-2">A premium private-sector hiring platform for verified jobs, live application tracking, and modern recruiter workflows.</p>
            <div className="mt-5 flex gap-3">
              <Link href="/contact" aria-label="Contact" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-2 hover:text-brand"><MessageCircle className="h-4 w-4" /></Link>
              <Link href="/about" aria-label="About" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-2 hover:text-brand"><UsersRound className="h-4 w-4" /></Link>
              <Link href="mailto:support@privatecareerjob.com" aria-label="Email support" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-2 hover:text-brand"><Mail className="h-4 w-4" /></Link>
            </div>
          </div>
          {[
            ["Company", [["About", "/about"], ["Contact", "/contact"], ["Create account", "/signup"]]],
            ["Product", [["Job seekers", "/job-seekers"], ["Recruiters", "/recruiters"], ["Resume maker", "/resume-maker"], ["AI tools", "/ai-tools"]]],
            ["Resources", [["Guides", "/resources"], ["Resume maker", "/resume-maker"], ["Hiring pipeline", "/recruiters"]]],
            ["Support", [["Help center", "/resources"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Delete account", "/data-deletion"]]],
          ].map(([heading, links]) => (
            <div key={heading as string}>
              <h3 className="text-sm font-extrabold text-ink">{heading as string}</h3>
              <ul className="mt-4 space-y-3 text-sm text-ink-2">
                {(links as string[][]).map(([label, href]) => <li key={label}><Link href={href} className="hover:text-brand">{label}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-[1180px] border-t border-line pt-6 text-sm text-ink-3">© 2026 privatecareerjob. Made in India.</div>
      </footer>
    </div>
  );
}
