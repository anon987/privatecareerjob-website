import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/marketing/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How privatecareerjob collects, uses, shares, and protects your personal data across the job-seeker and recruiter apps and website.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "24 July 2026";
const CONTACT = "support@privatecareerjob.com";

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated={UPDATED}
      intro="This policy explains what personal information privatecareerjob (“we”, “us”) collects, why we collect it, who we share it with, and the choices and rights you have. It applies to our Android app and our website."
    >
      <h2>Who we are</h2>
      <p>
        privatecareerjob is a two-sided job platform for India that connects private-sector job seekers with recruiters and
        employers. For any privacy question, contact us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li><strong>Account details:</strong> name, email address, phone number, and password (for email sign-in). If you use Google Sign-In, we receive your name, email, and profile photo from Google.</li>
        <li><strong>Profile information:</strong> headline, location, work experience, education, skills, languages, certificates, projects, job preferences, and your résumé/CV files and photos you upload.</li>
        <li><strong>Applications and messages:</strong> the applications you submit, screening answers, cover letters, and messages you exchange with recruiters.</li>
        <li><strong>Recruiter/company data:</strong> if you use a recruiter account — company name, logo, description, hiring preferences, and job postings.</li>
        <li><strong>Support requests:</strong> information you send us through our contact form or by email.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Device &amp; usage data:</strong> app version, device type, and basic diagnostics used to keep the service reliable.</li>
        <li><strong>Push token:</strong> a Firebase Cloud Messaging token, if you enable notifications, so we can deliver alerts.</li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>Create and operate your account and profile.</li>
        <li>Show relevant jobs to seekers and relevant candidates to recruiters, and power search, filters, and application tracking.</li>
        <li>Enable messaging between seekers and recruiters after an application.</li>
        <li>Provide optional AI tools (for example résumé feedback, ATS scoring, interview practice, salary estimates). When you use these, the relevant text from your profile or input is sent to Google’s Vertex AI (Gemini) to generate a response. We do not sell your data, and it is not used to train third-party models for advertising.</li>
        <li>Send you notifications about your applications, messages, and saved-search alerts.</li>
        <li>Maintain security, prevent abuse and fraud, and comply with law.</li>
      </ul>

      <h2>How your information is shared</h2>
      <ul>
        <li><strong>With recruiters:</strong> when you apply to a job, the recruiter for that job can see your application, profile details, résumé, and screening answers. Recruiter ratings and private notes about you are never shown to you and remain with that recruiter.</li>
        <li><strong>With service providers:</strong> we use Google Firebase (authentication, database, file storage, push messaging) and Google Cloud / Vertex AI to run the service. Your data is processed on their infrastructure under their security and privacy terms.</li>
        <li><strong>For legal reasons:</strong> if required by law, regulation, or valid legal process, or to protect the rights and safety of users and the public.</li>
        <li>We do <strong>not</strong> sell your personal data.</li>
      </ul>

      <h2>Data storage and security</h2>
      <p>
        Your data is stored using Google Firebase/Google Cloud. We restrict access using security rules so that each account
        can only read and write its own data, with recruiters limited to the applications submitted to their jobs. We use
        encryption in transit (HTTPS) and industry-standard safeguards. No method of transmission or storage is completely
        secure, so we cannot guarantee absolute security.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your information for as long as your account is active. When you delete your account, we delete your profile
        and associated personal data as described on our{" "}
        <Link href="/data-deletion">Data &amp; Account Deletion</Link> page, subject to any retention required by law.
      </p>

      <h2>Your rights and choices</h2>
      <ul>
        <li><strong>Access &amp; update:</strong> view and edit your profile and account details in the app at any time.</li>
        <li><strong>Delete:</strong> delete your account and data in-app (Profile → Account &amp; security / Settings → Delete account) or by request — see <Link href="/data-deletion">Data &amp; Account Deletion</Link>.</li>
        <li><strong>Notifications:</strong> control push notifications from your device settings.</li>
      </ul>

      <h2>Children</h2>
      <p>The service is intended for users aged 18 and above and is not directed to children. We do not knowingly collect data from anyone under 18.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. Material changes will be reflected by updating the “Last updated” date above and, where appropriate, through an in-app notice.</p>

      <h2>Contact us</h2>
      <p>Questions or requests: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p>
    </LegalDoc>
  );
}
