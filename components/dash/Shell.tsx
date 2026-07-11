"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import { auth } from "@/lib/firebaseClient";
import { ensureAccount, googleSignIn, webSignOut, type AppProfile } from "@/lib/account";

/**
 * Signed-in frame for the seeker portal: Google auth gate + top nav
 * (Jobs · Applications · Saved · Messages · My page). Provides {user, profile}
 * to every tab via useDash().
 */

interface DashValue {
  user: User;
  profile: AppProfile;
  /** Re-read users/{uid} after an edit so every tab sees fresh data. */
  refresh: () => Promise<void>;
}

const DashCtx = createContext<DashValue | null>(null);

export function useDash(): DashValue {
  const v = useContext(DashCtx);
  if (!v) throw new Error("useDash outside Shell");
  return v;
}

const TABS = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/saved", label: "Saved" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/ai", label: "AI Tools" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/resume", label: "Resume" },
  { href: "/dashboard/website", label: "My page" },
];

function accountInitials(name?: string, email?: string): string {
  const parts = (name || email || "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Avatar({ profile, user, size = "w-8 h-8 text-[12px]" }: { profile: AppProfile; user: User; size?: string }) {
  return (
    <span aria-hidden className={`grid place-items-center ${size} rounded-full bg-brand-tonal text-brand font-extrabold shrink-0 overflow-hidden`}>
      {profile.photoUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photoUri} alt="" className="w-full h-full object-cover" />
      ) : (
        accountInitials(profile.fullName, user.email ?? undefined)
      )}
    </span>
  );
}

/** Avatar + name in the nav; click opens a small account menu with sign out. */
function AccountMenu({ user, profile }: { user: User; profile: AppProfile }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstName = (profile.fullName || "").split(/\s+/)[0] || user.email || "Account";

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border border-line pl-1 pr-2.5 py-1 hover:bg-sunken transition cursor-pointer focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Avatar profile={profile} user={user} />
        <span className="text-[13.5px] font-bold text-ink max-w-[140px] truncate">{firstName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-line bg-white shadow-[0_18px_60px_rgba(17,24,39,0.12)] p-2 z-50">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar profile={profile} user={user} size="w-10 h-10 text-[14px]" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-extrabold truncate">{profile.fullName || "Your account"}</p>
              <p className="text-[12px] text-ink-3 truncate">{user.email}</p>
            </div>
          </div>
          <div className="my-1 h-px bg-line" />
          <Link
            href="/dashboard/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-ink hover:bg-sunken transition"
          >
            <UserRound className="h-4 w-4 text-ink-3" /> View profile
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => webSignOut()}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

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

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<AppProfile | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setError("");
        if (!u) {
          setProfile(null);
          return;
        }
        setProfile(undefined); // loading — don't fall through to the sign-in card
        try {
          setProfile(await ensureAccount(u));
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

  if (user === undefined || (user && profile === undefined && !error)) {
    return <div className="min-h-screen grid place-items-center text-ink-2">Loading…</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(700px_420px_at_50%_-10%,rgba(91,75,255,0.12),transparent_60%)]">
        <div className="rise w-full max-w-[440px] bg-white border border-line rounded-3xl p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-ink">
            <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
            privatesectorjob
          </Link>
          <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.5px]">Find your next job</h1>
          <p className="mt-1.5 text-ink-2 text-[14.5px]">
            Sign in with the same account you use in the app — browse live jobs, apply, track applications and chat with recruiters, right from the browser.
          </p>
          <button
            onClick={signIn}
            className="mt-6 w-full min-h-12 rounded-2xl border border-line bg-white hover:bg-sunken font-semibold text-[15px] transition flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <GoogleIcon /> Continue with Google
          </button>
          {error && <div className="mt-4 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div>}
          <p className="mt-5 text-center text-ink-2 text-[13.5px]">
            New here? <Link href="/signup" className="font-bold text-brand">Create an account</Link>
          </p>
        </div>
      </div>
    );
  }

  if (profile.role === "recruiter") {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <h1 className="text-[26px] font-extrabold">Recruiter account</h1>
          <p className="text-ink-2 mt-2 max-w-[420px]">This is the job-seeker dashboard — your hiring tools live in the recruiter portal.</p>
          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href="/recruiter" className="inline-flex items-center min-h-11 px-5 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold text-[14px] transition">
              Open recruiter portal
            </Link>
            <button onClick={() => webSignOut()} className="font-bold text-brand cursor-pointer">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashCtx.Provider value={{ user, profile, refresh: async () => setProfile(await ensureAccount(user)) }}>
      <div className="min-h-screen bg-paper flex flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
          <div className="max-w-[1020px] mx-auto px-5">
            <div className="h-14 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold text-ink">
                <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
                <span className="hidden sm:inline">privatesectorjob</span>
              </Link>
              <div className="hidden md:block">
                <AccountMenu user={user} profile={profile} />
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
            <nav className="hidden md:flex gap-1 -mb-px overflow-x-auto" aria-label="Dashboard">
              {TABS.map((t) => {
                const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
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
                <nav className="flex flex-col gap-1" aria-label="Dashboard">
                  {TABS.map((t) => {
                    const active = t.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(t.href);
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
                  <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 min-w-0">
                    <Avatar profile={profile} user={user} />
                    <span className="text-ink font-bold truncate">{profile.fullName || user.email}</span>
                  </Link>
                  <button onClick={() => webSignOut()} className="font-bold text-brand cursor-pointer shrink-0">Sign out</button>
                </div>
              </div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 w-full max-w-[1020px] mx-auto px-5 py-6">{children}</main>
      </div>
    </DashCtx.Provider>
  );
}
