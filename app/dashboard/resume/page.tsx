import type { Metadata } from "next";
import ResumeBuilder from "@/components/dash/ResumeBuilder";

export const metadata: Metadata = { title: "Resume builder" };

export default function ResumePage() {
  return <ResumeBuilder />;
}
