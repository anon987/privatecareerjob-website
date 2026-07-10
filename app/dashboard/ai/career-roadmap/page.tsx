import type { Metadata } from "next";
import CareerRoadmap from "@/components/dash/ai/CareerRoadmap";

export const metadata: Metadata = { title: "AI Career Roadmap" };

export default function CareerRoadmapPage() {
  return <CareerRoadmap />;
}
