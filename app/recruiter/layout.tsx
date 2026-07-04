import type { Metadata } from "next";
import { RecShell } from "@/components/recruiter/Shell";

export const metadata: Metadata = {
  title: { default: "Recruiter — privatesectorjob", template: "%s — privatesectorjob recruiter" },
  robots: { index: false, follow: false },
};

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return <RecShell>{children}</RecShell>;
}
