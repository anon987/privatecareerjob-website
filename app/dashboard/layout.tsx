import type { Metadata } from "next";
import { Shell } from "@/components/dash/Shell";

export const metadata: Metadata = {
  title: { default: "Dashboard — privatesectorjob", template: "%s — privatesectorjob" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
