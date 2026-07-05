"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";

type Role = "seeker" | "recruiter";

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/email-already-in-use") return "That email already has an account — open the app and sign in there.";
  if (code === "auth/invalid-email") return "That email address doesn't look right.";
  if (code === "auth/weak-password") return "Password needs at least 6 characters.";
  if (code === "auth/unauthorized-domain") return "Google sign-in isn't enabled for this domain yet — use email & password for now.";
  return (err as { message?: string })?.message ?? "Something went wrong — please try again.";
}

export default function SignupCard() {
  const params = useSearchParams();
  const router = useRouter();
  const [role, setRole] = useState<Role>(params.get("role") === "recruiter" ? "recruiter" : "seeker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const pickRole = (r: Role) => {
    setRole(r);
    router.replace(`/signup?role=${r}`);
  };

  /** After auth: enforce one-role-per-email, then create the user doc the app expects. */
  async function finishSignup(user: User, displayName: string, viaGoogle: boolean) {
    const em = (user.email ?? "").toLowerCase();
    if (!em) throw new Error("This account has no email address.");

    const roleRef = doc(db, "emailRoles", em);
    const existing = await getDoc(roleRef);
    if (existing.exists() && existing.data().role !== role) {
      await signOut(auth);
      throw new Error(`This email is already registered as a ${existing.data().role}. One email can hold only one role.`);
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const alreadyHadAccount = snap.exists();
    if (!snap.exists()) {
      const base = {
        role,
        onboarded: false,
        skills: [],
        preferredCategories: [],
        experienceLevel: "",
        education: [],
        experience: [],
        languages: [],
        certificates: [],
        projects: [],
        resumes: [],
        headline: "",
        phone: "",
        location: "",
        fullName: displayName || user.displayName || "",
        ...(role === "recruiter" ? { companyName: displayName || "" } : null),
      };
      await setDoc(userRef, base);
    }
    if (!existing.exists()) await setDoc(roleRef, { role, uid: user.uid });

    // Returning users are really signing in, not signing up — take them
    // straight to their dashboard instead of the "account ready" screen.
    if (alreadyHadAccount) {
      const dest = (snap.data()?.role ?? role) === "recruiter" ? "/recruiter" : "/dashboard";
      router.replace(dest);
      return;
    }

    setDone(
      `Your ${role} account is ready! Open the privatesectorjob app on your phone and sign in with this ${viaGoogle ? "Google account" : "email"} to continue.`
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
      await finishSignup(cred.user, name.trim(), false);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await finishSignup(cred.user, cred.user.displayName ?? "", true);
    } catch (err) {
      if ((err as { code?: string })?.code !== "auth/popup-closed-by-user") setError(friendlyAuthError(err));
    }
  };

  return (
    <div className="rise w-full max-w-[440px] bg-white border border-line rounded-3xl p-8 shadow-[0_18px_60px_rgba(17,24,39,0.08)]">
      <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-ink">
        <span className="grid place-items-center w-8 h-8 rounded-[9px] bg-brand text-white text-[17px]">P</span>
        privatesectorjob
      </Link>
      <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.5px]">Create your account</h1>
      <p className="mt-1.5 text-ink-2 text-[14.5px]">One email = one role, so pick the side you&apos;re on.</p>

      <div className="mt-6 grid grid-cols-2 gap-2 bg-sunken rounded-[14px] p-1.5">
        {(["seeker", "recruiter"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => pickRole(r)}
            className={`py-2.5 px-2 rounded-[10px] text-sm font-bold transition ${
              role === r ? "bg-white text-brand shadow-[0_2px_8px_rgba(17,24,39,0.08)]" : "text-ink-2"
            }`}
          >
            {r === "seeker" ? "🎯 I'm a job seeker" : "💼 I'm a recruiter"}
          </button>
        ))}
      </div>

      {done ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">✓ {done}</div>
          <Link href="/dashboard" className="block w-full text-center min-h-12 leading-[48px] rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition">
            Set up your page →
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={submit}>
            <div className="mt-4">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">
                {role === "recruiter" ? "Company name" : "Full name"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder={role === "recruiter" ? "Acme Retail Pvt Ltd" : "Prashant Kumar"}
                className="w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition"
              />
            </div>
            <div className="mt-4">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition"
              />
            </div>
            <div className="mt-4">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full min-h-12 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition disabled:opacity-50"
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4 text-ink-3 text-xs before:content-[''] before:h-px before:flex-1 before:bg-line after:content-[''] after:h-px after:flex-1 after:bg-line">
            or
          </div>

          <button
            type="button"
            onClick={google}
            className="w-full min-h-12 rounded-2xl border border-line bg-white hover:bg-sunken font-semibold text-[15px] transition flex items-center justify-center gap-2.5"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 40.4 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Continue with Google
          </button>
        </>
      )}

      {error ? <div className="mt-4 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div> : null}

      <p className="mt-5 text-center text-ink-2 text-[13.5px]">
        Already have an account? Sign in inside the app.
        <br />
        By continuing you agree to our terms.
      </p>
    </div>
  );
}
