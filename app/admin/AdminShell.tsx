"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { callAdmin } from "@/lib/admin/client";

/**
 * Client shell for /admin: Firebase sign-in gate + server-verified admin check
 * (the API rejects non-allowlisted emails, so the UI gate is purely UX).
 */

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/blogs", label: "Blog posts", icon: "✍️" },
  { href: "/admin/contacts", label: "Messages", icon: "📬" },
  { href: "/admin/seekers", label: "Job seekers", icon: "🧑‍💼" },
  { href: "/admin/recruiters", label: "Recruiters", icon: "🏢" },
  { href: "/admin/jobs", label: "Jobs", icon: "💼" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [gateErr, setGateErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setGateErr("");
      if (u) {
        try {
          // allowlist-only check — independent of Firestore/data endpoints
          await callAdmin("me");
          setIsAdmin(true);
        } catch (e) {
          setIsAdmin(false);
          setGateErr(e instanceof Error ? e.message : "Admin check failed.");
        }
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setErr("Sign-in failed — check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center opacity-60">Loading…</div>;
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
        <form onSubmit={signIn} className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Admin sign-in</h1>
          <p className="mt-1 text-sm opacity-60">privatesectorjob control panel</p>
          {user && !isAdmin ? (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Signed in as {user.email} — {gateErr || "not an admin account."}{" "}
              <button type="button" className="underline" onClick={() => signOut(auth)}>
                Sign out
              </button>
            </p>
          ) : (
            <>
              <input
                className="mt-6 w-full rounded-xl border border-black/15 px-4 py-2.5"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="mt-3 w-full rounded-xl border border-black/15 px-4 py-2.5"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
              <button
                className="mt-5 w-full rounded-xl bg-violet-600 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                disabled={busy || !email || !password}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => signInWithPopup(auth, new GoogleAuthProvider()).catch(() => setErr("Google sign-in failed."))}
                className="mt-3 w-full rounded-xl border border-black/15 py-2.5 font-semibold hover:bg-neutral-50"
              >
                Continue with Google
              </button>
            </>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-black/10 bg-white p-4 sm:flex">
        <div className="px-2 py-3 font-bold">
          privatesector<span className="text-violet-600">job</span>
          <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700">admin</span>
        </div>
        <nav className="mt-2 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-xl px-3 py-2 text-sm font-medium ${
                pathname === n.href ? "bg-violet-600 text-white" : "hover:bg-neutral-100"
              }`}
            >
              <span className="mr-2">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto rounded-xl px-3 py-2 text-left text-sm opacity-60 hover:bg-neutral-100">
          Sign out ({user.email})
        </button>
      </aside>
      <main className="min-w-0 flex-1 p-6 sm:p-10">
        <nav className="mb-4 flex gap-2 overflow-x-auto sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                pathname === n.href ? "bg-violet-600 text-white" : "bg-white border border-black/10"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}
