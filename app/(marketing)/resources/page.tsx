import type { Metadata } from "next";
import { ResourcesMarketingPage } from "@/components/marketing/MarketingPages";

export const metadata: Metadata = {
  title: "Resources — Job search and hiring guides",
  description: "Guides for application tracking, resume readiness, candidate pipelines, hiring workflows, and upcoming AI tool previews.",
};

export default function ResourcesPage() {
  return <ResourcesMarketingPage />;
}
