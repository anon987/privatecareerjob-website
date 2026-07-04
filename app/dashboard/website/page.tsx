import type { Metadata } from "next";
import WebsiteManager from "@/components/dash/WebsiteManager";

export const metadata: Metadata = { title: "My page" };

export default function WebsitePage() {
  return <WebsiteManager />;
}
