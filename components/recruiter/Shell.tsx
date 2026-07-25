"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Menu, X } from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import { fetchProfile, googleSignIn, webSignOut, type AppProfile } from "@/lib/account";

/**
 * Recruiter portal frame: Google auth gate (must be a recruiter account created in
 * the app or via signup), top nav Dashboard · Jobs · Candidates · Messages.
 * Team members automatically operate on the company owner's data (employerId).
 */

interface RecValue {
  user: User;
  profile: AppProfile;
  /** company owner uid: profile.companyId for teammates, own uid for owners */
  employerId: string;
  refresh: () => Promise<void>;
}

const RecCtx = createContext<RecValue | null>(null);

export function useRec(): RecValue {
  const v = useContext(RecCtx);
  if (!v) throw new Error("useRec outside recruiter Shell");
  return v;
}

const TABS = [
  { href: "/recruiter", label: "Dashboard" },
  { href: "/recruiter/jobs", label: "Jobs" },
  { href: "/recruiter/candidates", label: "Candidates" },
  { href: "/recruiter/messages", label: "Messages" },
];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.4 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

export function RecShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<AppProfile | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const load = async (u: User) => setProfile(await fetchProfile(u.uid));

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setError("");
        if (!u) {
          setProfile(undefined);
          return;
        }
        try {
          await load(u);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not load your account.");
        }
      }),
    []
  );

  const signIn = async () => {
    setError("");
    try {
      await googleSignIn();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (code !== "auth/popup-closed-by-user") setError((e as Error)?.message ?? "Sign-in failed.");
    }
  };

  if (user === undefined || (user && profile === undefined)) {
    return <div className="min-h-screen grid place-items-center text-ink-2">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(700px_420px_at_50%_-10%,rgba(91,75,255,0.12),transparent_60%)]">
        <div className="rise w-full max-w-[440px] bg-white border border-line rounded-3xl p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-ink">
            <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
            privatecareerjob
          </Link>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.5px]">Recruiter portal</h1>
          <p className="mt-1.5 text-ink-2 text-[14.5px]">
            Post jobs, manage your candidate pipeline and message applicants — from the browser, synced live with the app.
          </p>
          <button
            onClick={signIn}
            className="mt-6 w-full min-h-12 rounded-2xl border border-line bg-white hover:bg-sunken font-semibold text-[15px] transition flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <GoogleIcon /> Continue with Google
          </button>
          {error && <div className="mt-4 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div>}
          <p className="mt-5 text-center text-ink-2 text-[13.5px]">
            No recruiter account yet? <Link href="/signup?role=recruiter" className="font-bold text-brand">Create one</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!profile || profile.role !== "recruiter") {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <h1 className="text-[26px] font-extrabold">{profile ? "This is a job-seeker account" : "No account found"}</h1>
          <p className="text-ink-2 mt-2 max-w-[440px]">
            {profile
              ? "The recruiter portal needs a recruiter account. Your seeker dashboard is over here:"
              : "Create a recruiter account first — it takes a minute."}
          </p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href={profile ? "/dashboard" : "/signup?role=recruiter"} className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition">
              {profile ? "Go to my dashboard" : "Sign up as recruiter"}
            </Link>
            <button onClick={() => webSignOut()} className="font-bold text-brand cursor-pointer">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const employerId = profile.companyId || user.uid;

  return (
    <RecCtx.Provider value={{ user, profile, employerId, refresh: () => load(user) }}>
      <div className="min-h-screen bg-paper flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="max-w-[1020px] mx-auto px-5">
            <div className="h-14 flex items-center justify-between">
              <Link href="/recruiter" className="flex items-center gap-2.5 font-extrabold text-ink">
                <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
                <span className="hidden sm:inline">privatecareerjob</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-tonal text-brand text-[10.5px] font-bold uppercase tracking-wider">Recruiter</span>
              </Link>
              <div className="hidden md:flex items-center gap-3 text-[13.5px]">
                <span className="text-ink-2">{profile.companyName || user.email}</span>
                <button onClick={() => webSignOut()} className="font-bold text-brand cursor-pointer">Sign out</button>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="md:hidden grid h-10 w-10 -mr-1 place-items-center rounded-xl border border-line text-ink transition hover:bg-sunken"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            {/* Desktop tabs */}
            <nav className="hidden md:flex gap-1 -mb-px" aria-label="Recruiter portal">
              {TABS.map((t) => {
                const active = t.href === "/recruiter" ? pathname === "/recruiter" : pathname.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`px-4 py-2.5 text-[14px] font-bold border-b-2 whitespace-nowrap transition-colors ${
                      active ? "border-brand text-brand" : "border-transparent text-ink-2 hover:text-ink"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
            {/* Mobile menu */}
            {menuOpen ? (
              <div className="md:hidden pb-3 pt-1">
                <nav className="flex flex-col gap-1" aria-label="Recruiter portal">
                  {TABS.map((t) => {
                    const active = t.href === "/recruiter" ? pathname === "/recruiter" : pathname.startsWith(t.href);
                    return (
                      <Link
                        key={t.href}
                        href={t.href}
                        onClick={() => setMenuOpen(false)}
                        className={`rounded-xl px-4 py-3 text-[15px] font-bold transition ${
                          active ? "bg-brand-tonal text-brand" : "text-ink-2 hover:bg-sunken hover:text-ink"
                        }`}
                      >
                        {t.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-1 pt-3 text-[13.5px]">
                  <span className="text-ink-2 truncate">{profile.companyName || user.email}</span>
                  <button onClick={() => webSignOut()} className="font-bold text-brand cursor-pointer shrink-0">Sign out</button>
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 w-full max-w-[1020px] mx-auto px-5 py-6">{children}</main>
      </div>
    </RecCtx.Provider>
  );
}
