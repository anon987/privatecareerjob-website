import type { Metadata } from "next";
import InterviewCoach from "@/components/dash/ai/InterviewCoach";

export const metadata: Metadata = { title: "AI Interview Coach" };

export default function InterviewCoachPage() {
  return <InterviewCoach />;
}
