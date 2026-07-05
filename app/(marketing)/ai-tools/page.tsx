import type { Metadata } from "next";
import { AiToolsMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "AI Tools — Premium career and recruiter AI previews",
  description: "Explore static previews of upcoming AI resume, ATS, interview, job match, salary, profile, recruiter, and job description tools.",
};

export default function AiToolsPage() {
  return <AiToolsMarketingPage />;
}
