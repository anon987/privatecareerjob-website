import { Suspense } from "react";
import type { Metadata } from "next";
import Inbox from "@/components/recruiter/Inbox";

export const metadata: Metadata = { title: "Messages" };

export default function RecruiterMessagesPage() {
  return (
    <Suspense fallback={null}>
      <Inbox />
    </Suspense>
  );
}
