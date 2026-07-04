import type { Metadata } from "next";
import JobsList from "@/components/recruiter/JobsList";

export const metadata: Metadata = { title: "Jobs" };

export default function RecruiterJobs() {
  return <JobsList />;
}
