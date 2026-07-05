import type { Metadata } from "next";
import { ContactMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Contact — PrivateSectorJob",
  description: "Contact PrivateSectorJob for support, job seeker questions, recruiter onboarding, and platform information.",
};

export default function ContactPage() {
  return <ContactMarketingPage />;
}
