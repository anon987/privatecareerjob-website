import type { Metadata } from "next";
import { HomeMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "PrivateSectorJob — Premium verified jobs and modern hiring",
  description: "A premium private-sector job platform with verified employers, live application tracking, recruiter workflows, and upcoming AI career tools.",
};

export default function HomePage() {
  return <HomeMarketingPage />;
}
