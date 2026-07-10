import type { Metadata } from "next";
import AtsScore from "@/components/dash/ai/AtsScore";

export const metadata: Metadata = { title: "AI ATS Score Checker" };

export default function AtsScorePage() {
  return <AtsScore />;
}
