import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/marketing/LegalDoc";

export const metadata: Metadata = {
  title: "Data & Account Deletion",
  description:
    "How to delete your privatecareerjob account and personal data, what gets removed, and how to request deletion by email.",
  alternates: { canonical: "/data-deletion" },
};

const UPDATED = "24 July 2026";
const CONTACT = "support@privatecareerjob.com";

export default function DataDeletionPage() {
  return (
    <LegalDoc
      title="Data & Account Deletion"
      updated={UPDATED}
      intro="You can delete your privatecareerjob account and personal data at any time. This page explains how, what is removed, and how to request deletion if you can’t access the app."
    >
      <h2>Delete your account in the app</h2>
      <p>The fastest way is directly in the app:</p>
      <ul>
        <li>Open the app and sign in.</li>
        <li>Go to <strong>Profile → Account &amp; security</strong> (or <strong>Settings</strong>).</li>
        <li>Tap <strong>Delete account</strong> and confirm.</li>
      </ul>
      <p>Your account is deleted immediately, and you are signed out.</p>

      <h2>Request deletion by email</h2>
      <p>
        If you no longer have access to the app, email{" "}
        <a href={`mailto:${CONTACT}?subject=Account%20deletion%20request`}>{CONTACT}</a> from the email address on your
        account with the subject “Account deletion request”. We will verify your identity and delete your data within
        30 days.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account and sign-in credentials.</li>
        <li>Your profile: name, contact details, headline, location, experience, education, skills, résumé files and photos.</li>
        <li>Your saved jobs, saved searches, and preferences.</li>
      </ul>

      <h2>What may be retained</h2>
      <ul>
        <li>
          Records that recruiters need for their own legitimate hiring and legal compliance — for example, an application
          you already submitted to a recruiter may remain in that recruiter’s pipeline. Message threads may persist for the
          other participant. Contact us if you need these addressed.
        </li>
        <li>Limited information we are required to keep by law, or anonymised/aggregated data that no longer identifies you.</li>
      </ul>

      <h2>Timeline</h2>
      <p>In-app deletion is immediate for your account and profile. Email-requested deletions are completed within 30 days of identity verification.</p>

      <h2>Questions</h2>
      <p>
        See our <Link href="/privacy">Privacy Policy</Link> for how we handle data, or contact{" "}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </LegalDoc>
  );
}
