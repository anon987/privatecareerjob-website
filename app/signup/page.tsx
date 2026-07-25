import { Suspense } from "react";
import type { Metadata } from "next";
import SignupCard from "./SignupCard";

export const metadata: Metadata = { title: "Sign up — privatecareerjob" };

export default function SignupPage() {
  return (
    <div className="min-h-screen grid place-items-center px-5 py-12 bg-[radial-gradient(700px_420px_at_50%_-10%,rgba(91,75,255,0.12),transparent_60%)]">
      <Suspense fallback={null}>
        <SignupCard />
      </Suspense>
    </div>
  );
}
