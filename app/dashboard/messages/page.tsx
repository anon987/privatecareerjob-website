import { Suspense } from "react";
import type { Metadata } from "next";
import Messages from "@/components/dash/Messages";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <Messages />
    </Suspense>
  );
}
