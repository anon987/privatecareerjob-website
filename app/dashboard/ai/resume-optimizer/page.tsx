import type { Metadata } from "next";
import ResumeOptimizer from "@/components/dash/ai/ResumeOptimizer";

export const metadata: Metadata = { title: "AI Resume Optimizer" };

export default function ResumeOptimizerPage() {
  return <ResumeOptimizer />;
}
