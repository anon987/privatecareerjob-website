import type { Metadata } from "next";
import JobsFeed from "@/components/dash/JobsFeed";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsPage() {
  return <JobsFeed />;
}
