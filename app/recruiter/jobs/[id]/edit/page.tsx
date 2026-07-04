import type { Metadata } from "next";
import JobForm from "@/components/recruiter/JobForm";

export const metadata: Metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <JobForm jobId={id} />;
}
