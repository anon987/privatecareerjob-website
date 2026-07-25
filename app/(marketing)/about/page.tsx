import type { Metadata } from "next";
import { AboutMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "About — PrivateCareerJob",
  description: "PrivateCareerJob is building a premium, transparent platform for verified private-sector jobs and modern recruiter workflows.",
};

export default function AboutPage() {
  return <AboutMarketingPage />;
}
