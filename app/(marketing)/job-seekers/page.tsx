import type { Metadata } from "next";
import { JobSeekersMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Job Seekers — Live tracking, resumes, profiles, and AI previews",
  description: "Apply to verified jobs, track application status live, build resumes, share a public profile, and preview upcoming AI career tools.",
};

export default function JobSeekersPage() {
  return <JobSeekersMarketingPage />;
}
