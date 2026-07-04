import type { Metadata } from "next";
import Applications from "@/components/dash/Applications";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage() {
  return <Applications />;
}
