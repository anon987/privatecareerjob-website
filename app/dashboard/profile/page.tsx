import type { Metadata } from "next";
import Profile from "@/components/dash/Profile";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return <Profile />;
}
