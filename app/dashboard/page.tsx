import type { Metadata } from "next";
import Home from "@/components/dash/Home";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return <Home />;
}
