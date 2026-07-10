import type { Metadata } from "next";
import ProfileOptimizer from "@/components/dash/ai/ProfileOptimizer";

export const metadata: Metadata = { title: "AI Profile Optimizer" };

export default function ProfileOptimizerPage() {
  return <ProfileOptimizer />;
}
