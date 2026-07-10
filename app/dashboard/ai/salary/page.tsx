import type { Metadata } from "next";
import SalaryEstimator from "@/components/dash/ai/SalaryEstimator";

export const metadata: Metadata = { title: "AI Salary Estimator" };

export default function SalaryEstimatorPage() {
  return <SalaryEstimator />;
}
