import type { Metadata } from "next";
import Candidates from "@/components/recruiter/Candidates";

export const metadata: Metadata = { title: "Candidates" };

export default function CandidatesPage() {
  return <Candidates />;
}
