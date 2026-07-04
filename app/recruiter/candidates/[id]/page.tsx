import type { Metadata } from "next";
import CandidateDetail from "@/components/recruiter/CandidateDetail";

export const metadata: Metadata = { title: "Candidate" };

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CandidateDetail appId={id} />;
}
