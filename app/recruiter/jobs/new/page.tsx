import type { Metadata } from "next";
import JobForm from "@/components/recruiter/JobForm";

export const metadata: Metadata = { title: "Post a job" };

export default function NewJobPage() {
  return <JobForm />;
}
