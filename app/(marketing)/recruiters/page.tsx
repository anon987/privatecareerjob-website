import type { Metadata } from "next";
import { RecruitersMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Recruiters — Modern candidate pipelines and hiring workflows",
  description: "Post jobs, manage candidates, chat with applicants, track hiring analytics, and preview recruiter AI tools in PrivateCareerJob.",
};

export default function RecruitersPage() {
  return <RecruitersMarketingPage />;
}
