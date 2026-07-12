import type { Metadata } from "next";
import { ResumeMakerPage } from "@/components/marketing/ResumeMakerPage";

export const metadata: Metadata = {
  title: "Free Resume Maker — ATS-friendly resumes in minutes",
  description:
    "Build a professional, ATS-friendly resume for free. 26 templates, automatic profile fill, AI-polished wording, and true selectable-text PDF downloads — no watermarks or paid unlocks.",
};

export default function ResumeMakerRoute() {
  return <ResumeMakerPage />;
}
