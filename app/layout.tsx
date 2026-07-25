import type { Metadata } from "next";
import { Manrope, Playfair_Display, Space_Grotesk, Nunito, JetBrains_Mono } from "next/font/google";
import { SITE_ORIGIN } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

const SITE_NAME = "privatecareerjob";
const DEFAULT_TITLE = "privatecareerjob — India's premium job platform";
const DEFAULT_DESCRIPTION =
  "Find verified private-sector jobs, track every application live, and hire great people — one premium platform for job seekers and recruiters across India.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: DEFAULT_TITLE, template: `%s — ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "jobs in India",
    "private sector jobs",
    "verified jobs",
    "job application tracker",
    "free resume maker",
    "ATS resume builder",
    "hire candidates India",
    "recruitment platform",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_ORIGIN,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/** Sitewide structured data: the organization + site (with search-free schema). */
const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/opengraph-image`,
  sameAs: [],
};
const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  inLanguage: "en-IN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${playfair.variable} ${grotesk.variable} ${nunito.variable} ${jbmono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([ORG_JSONLD, WEBSITE_JSONLD]) }}
        />
        {children}
      </body>
    </html>
  );
}
