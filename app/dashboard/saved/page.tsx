import type { Metadata } from "next";
import Saved from "@/components/dash/Saved";

export const metadata: Metadata = { title: "Saved jobs" };

export default function SavedPage() {
  return <Saved />;
}
