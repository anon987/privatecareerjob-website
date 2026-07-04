import type { Metadata } from "next";
import AITools from "@/components/dash/AITools";

export const metadata: Metadata = { title: "AI tools" };

export default function AIToolsPage() {
  return <AITools />;
}
