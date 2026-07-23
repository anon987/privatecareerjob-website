import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/marketing/LegalDoc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of the privatesectorjob apps and website for job seekers and recruiters.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "24 July 2026";
const CONTACT = "support@privatesectorjob.com";

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated={UPDATED}
      intro="These terms are an agreement between you and privatesectorjob governing your use of our apps and website. By creating an account or using the service, you agree to these terms."
    >
      <h2>1. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old to use the service. You are responsible for the accuracy of the information you
        provide and for keeping your account credentials secure. You are responsible for all activity under your account.
      </p>

      <h2>2. The service</h2>
      <p>
        privatesectorjob helps job seekers discover and apply to jobs and track applications, and helps recruiters post jobs
        and manage candidates. We provide the platform “as is” and do not guarantee employment, hiring, interviews, or any
        particular outcome.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post false, misleading, discriminatory, or unlawful content, including fake jobs or fraudulent listings.</li>
        <li>Charge job seekers fees to apply, or use the platform to solicit payments or deposits from candidates.</li>
        <li>Harass, spam, impersonate, or misuse another person’s information.</li>
        <li>Scrape, reverse-engineer, disrupt, or attempt to gain unauthorised access to the service.</li>
        <li>Upload malware or violate any applicable law or third-party rights.</li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of the content you provide (profile, résumé, job postings, messages). You grant us a limited
        licence to host, display, and process that content solely to operate and improve the service. When you apply to a
        job, you permit the relevant recruiter to view your application and profile as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>5. AI tools</h2>
      <p>
        Some features use AI to generate suggestions (for example résumé feedback, ATS scores, interview practice, salary
        estimates, and scam checks). AI output can be inaccurate or incomplete and is provided for guidance only. You are
        responsible for reviewing and deciding how to use it; it is not professional, legal, or career advice.
      </p>

      <h2>6. Recruiter responsibilities</h2>
      <p>
        Recruiters must post genuine opportunities, comply with applicable employment and anti-discrimination laws, and use
        candidate data only for legitimate hiring purposes related to their postings.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may stop using the service and delete your account at any time (see{" "}
        <Link href="/data-deletion">Data &amp; Account Deletion</Link>). We may suspend or terminate accounts that violate
        these terms or harm other users or the platform.
      </p>

      <h2>8. Disclaimers and limitation of liability</h2>
      <p>
        The service is provided “as is” without warranties of any kind. To the maximum extent permitted by law,
        privatesectorjob is not liable for indirect, incidental, or consequential damages, or for any hiring decisions,
        job outcomes, or interactions between seekers and recruiters.
      </p>

      <h2>9. Governing law</h2>
      <p>These terms are governed by the laws of India, and disputes are subject to the courts located in India.</p>

      <h2>10. Changes</h2>
      <p>We may update these terms; the “Last updated” date reflects the latest version. Continued use after changes means you accept the updated terms.</p>

      <h2>11. Contact</h2>
      <p>Questions about these terms: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </LegalDoc>
  );
}
