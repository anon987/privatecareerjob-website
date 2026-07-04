import type { Metadata } from "next";
import { Manrope, Playfair_Display, Space_Grotesk, Nunito, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  title: "privatesectorjob — India's premium job platform",
  description:
    "Find verified private-sector jobs, track every application live, and hire great people — one premium platform for job seekers and recruiters across India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${playfair.variable} ${grotesk.variable} ${nunito.variable} ${jbmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">{children}</body>
    </html>
  );
}
