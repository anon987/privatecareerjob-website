import type { Metadata } from "next";
import JobMatch from "@/components/dash/ai/JobMatch";

export const metadata: Metadata = { title: "AI Job Match Assistant" };

export default function JobMatchPage() {
  return <JobMatch />;
}
