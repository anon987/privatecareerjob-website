import type { Metadata } from "next";
import Overview from "@/components/recruiter/Overview";

export const metadata: Metadata = { title: "Dashboard" };

export default function RecruiterHome() {
  return <Overview />;
}
