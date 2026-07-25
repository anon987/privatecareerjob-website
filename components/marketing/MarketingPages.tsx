"use client";

import { ContactForm } from "./ContactForm";
import {
  AiToolsGrid,
  Comparison,
  CTASection,
  FAQSection,
  FeatureGrid,
  Metrics,
  PageHero,
  recruiterFeatures,
  RecruiterPipeline,
  ResourceCards,
  seekerFeatures,
  Testimonials,
} from "./MarketingSections";

export function HomeMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="Verified jobs. Real-time application tracking."
        title="The job platform India deserves."
        gradient="Premium for both sides."
        body="PrivateCareerJob brings seekers and recruiters into one polished platform for verified roles, transparent applications, and faster hiring decisions."
        primary={{ href: "/signup?role=seeker", label: "Create seeker account" }}
        secondary={{ href: "/recruiters", label: "Explore recruiting" }}
        visual="phone"
      />
      <Metrics />
      <FeatureGrid heading="A cleaner way to apply and hire" subtitle="The essentials are built in: verified jobs, live stages, recruiter chat, resumes, public profiles, and timely alerts." features={seekerFeatures.slice(0, 3)} tone="purple" />
      <RecruiterPipeline />
      <AiToolsGrid withPreview={false} />
      <Comparison />
      <Testimonials />
      <CTASection />
    </>
  );
}

export function JobSeekersMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="For job seekers"
        title="Know exactly where"
        gradient="every application stands."
        body="A modern seeker experience for verified jobs, live timelines, resume tools, public profiles, recruiter chat, alerts, and premium AI career previews."
        primary={{ href: "/signup?role=seeker", label: "Create seeker account" }}
        secondary={{ href: "/ai-tools", label: "Preview AI tools" }}
        visual="phone"
      />
      <FeatureGrid heading="Everything job seekers need in one place" subtitle="Application tracking, resume tools, public profiles, recruiter messaging, and AI career previews are designed around the real job-search workflow." features={seekerFeatures} tone="purple" />
      <AiToolsGrid />
      <Testimonials />
      <CTASection />
    </>
  );
}

export function RecruitersMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="For recruiters"
        title="Run hiring from"
        gradient="one focused pipeline."
        body="Post roles, review candidates, shortlist, interview, offer, hire, and keep every conversation connected to the hiring workflow."
        primary={{ href: "/signup?role=recruiter", label: "Create recruiter account" }}
        secondary={{ href: "/resources", label: "View hiring resources" }}
        visual="pipeline"
      />
      <FeatureGrid heading="Purpose-built for private-sector hiring" subtitle="Recruiters get structured job posting, candidate pipeline management, messaging, analytics, and AI previews without the clutter of old portals." features={recruiterFeatures} tone="white" />
      <RecruiterPipeline />
      <AiToolsGrid withPreview={false} />
      <Testimonials />
      <CTASection />
    </>
  );
}

export function AiToolsMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="Static premium AI previews"
        title="AI career tools"
        gradient="available after login."
        body="Showcase upcoming AI-powered workflows for resumes, ATS scoring, cover letters, interview coaching, job matching, skill gaps, salary insights, recruiter assistance, and job descriptions. No AI functionality runs on this page."
        primary={{ href: "/dashboard", label: "Sign in to use" }}
        secondary={{ href: "/signup", label: "Create account" }}
        visual="ai"
      />
      <AiToolsGrid />
      <FAQSection />
      <CTASection />
    </>
  );
}

export function ResourcesMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Practical guides for"
        gradient="modern hiring."
        body="Learn how to use transparent application stages, polished profiles, resume readiness, recruiter pipelines, and premium AI previews responsibly."
        primary={{ href: "/job-seekers", label: "For job seekers" }}
        secondary={{ href: "/recruiters", label: "For recruiters" }}
        visual="contact"
      />
      <ResourceCards />
      <FAQSection />
      <CTASection />
    </>
  );
}

export function AboutMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="About PrivateCareerJob"
        title="A more transparent"
        gradient="private-sector job market."
        body="We are building a cleaner, more trustworthy experience for candidates and employers: verified opportunities, live tracking, public profiles, recruiter workflows, and clear AI previews."
        primary={{ href: "/signup", label: "Join PrivateCareerJob" }}
        secondary={{ href: "/contact", label: "Contact us" }}
        visual="pipeline"
      />
      <Metrics />
      <FeatureGrid heading="What we are building for both sides" subtitle="A single platform that respects the candidate's time and the recruiter's workflow, from the first application to the final hire." features={seekerFeatures.slice(0, 3)} tone="purple" />
      <RecruiterPipeline />
      <Comparison />
      <Testimonials />
      <CTASection />
    </>
  );
}

export function ContactMarketingPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the"
        gradient="PrivateCareerJob team."
        body="Reach us for seeker support, recruiter onboarding, product questions, or partnership conversations. The fastest path into the platform is still creating your account."
        primary={{ href: "mailto:support@privatecareerjob.com", label: "Email support" }}
        secondary={{ href: "/signup", label: "Create account" }}
        visual="contact"
      />
      <section className="px-6 py-14">
        <ContactForm />
      </section>
      <ResourceCards />
      <FAQSection />
      <CTASection />
    </>
  );
}
