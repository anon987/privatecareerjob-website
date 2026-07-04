"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import type { ApplicationDoc, JobDoc, ScreeningQuestion, StatusKey } from "./seeker";

/**
 * Recruiter data layer for the web portal — identical Firestore shapes to the
 * app's src/lib/jobs.ts / applications.ts / team.ts, so both clients stay in sync.
 * Team members operate on the company owner's data via employerId = companyId ?? uid.
 */

/* ---------------- job posting (mirrors the app's constants) ---------------- */

export const JOB_CATEGORIES = [
  "Retail", "Sales & Business Development", "BPO / Customer Support", "Telecalling", "Field Sales",
  "Banking / Finance", "Accounting", "Logistics / Supply Chain", "Delivery / Driver", "Warehouse / Operations",
  "IT / Software", "Data Entry / Back Office", "Human Resources", "Marketing / Digital Marketing",
  "Healthcare / Nursing", "Education / Teaching", "Hospitality / Hotel", "Manufacturing / Production",
  "Construction / Civil", "Security Guard", "Beauty / Wellness", "Engineering", "Design / Creative",
  "Receptionist / Front Office", "Mechanic / Technician", "Other",
];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary", "Freelance", "Work from home"];

export const EXPERIENCE_OPTIONS = ["Fresher", "Less than 1 year", "1–2 years", "2–3 years", "3–5 years", "5–7 years", "7+ years"];

export interface NewJobInput {
  title: string;
  category: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  experienceLevel: string;
  jobType?: string;
  description?: string;
  questions?: ScreeningQuestion[];
}

export async function createJob(employerId: string, companyName: string, input: NewJobInput): Promise<void> {
  await addDoc(collection(db, "jobs"), {
    employerId,
    companyName: companyName || "",
    title: input.title.trim(),
    category: input.category,
    location: input.location.trim(),
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    experienceLevel: input.experienceLevel,
    jobType: input.jobType?.trim() || "",
    description: input.description?.trim() || "",
    status: "live",
    applicants: 0,
    questions: input.questions ?? [],
    postedAt: serverTimestamp(),
  });
}

export async function updateJob(jobId: string, input: NewJobInput): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), {
    title: input.title.trim(),
    category: input.category,
    location: input.location.trim(),
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    experienceLevel: input.experienceLevel,
    jobType: input.jobType?.trim() || "",
    description: input.description?.trim() || "",
    questions: input.questions ?? [],
  });
}

export async function setJobStatus(jobId: string, status: "live" | "closed"): Promise<void> {
  await updateDoc(doc(db, "jobs", jobId), { status });
}

export async function deleteJob(jobId: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", jobId));
}

/** Live subscription to the company's jobs, newest first (client-side sort — no index). */
export function useRecruiterJobs(employerId?: string): { jobs: JobDoc[]; loading: boolean } {
  const [jobs, setJobs] = useState<JobDoc[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!employerId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "jobs"), where("employerId", "==", employerId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JobDoc, "id">) }));
        list.sort((a, b) => (b.postedAt?.toMillis?.() ?? 0) - (a.postedAt?.toMillis?.() ?? 0));
        setJobs(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [employerId]);
  return { jobs, loading };
}

/* ---------------- candidates ---------------- */

/** Every application to this company's jobs. */
export function useEmployerApplications(employerId?: string): { apps: ApplicationDoc[]; loading: boolean } {
  const [apps, setApps] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!employerId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "jobApplications"), where("employerId", "==", employerId));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ApplicationDoc, "id">) }));
        list.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0));
        setApps(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [employerId]);
  return { apps, loading };
}

export function useApplication(appId?: string): { app: (ApplicationDoc & { recruiterNotes?: string; recruiterRating?: number }) | null; loading: boolean } {
  const [app, setApp] = useState<(ApplicationDoc & { recruiterNotes?: string; recruiterRating?: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!appId) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "jobApplications", appId),
      (snap) => {
        setApp(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<ApplicationDoc, "id">) }) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [appId]);
  return { app, loading };
}

export async function updateApplicationStatus(appId: string, status: StatusKey): Promise<void> {
  await updateDoc(doc(db, "jobApplications", appId), { status });
}

/** Recruiter-private notes/rating (same fields the app writes). */
export async function updateApplication(appId: string, partial: { recruiterNotes?: string; recruiterRating?: number }): Promise<void> {
  const clean = Object.fromEntries(Object.entries(partial).filter(([, v]) => v !== undefined));
  await updateDoc(doc(db, "jobApplications", appId), clean);
}

/* ---------------- team invites (mirrors the app's team.ts) ---------------- */

export interface TeamInvite {
  email: string;
  companyUid: string;
  companyName: string;
  role: "Admin" | "Recruiter" | "HR";
  status: "invited" | "accepted" | "declined";
  memberUid?: string;
  memberName?: string;
}

/** The signed-in user's own pending invite, if any (doc id = lowercase email). */
export function useMyInvite(email?: string | null): TeamInvite | null {
  const [invite, setInvite] = useState<TeamInvite | null>(null);
  useEffect(() => {
    if (!email) return;
    const id = email.trim().toLowerCase();
    return onSnapshot(
      doc(db, "companyInvites", id),
      (snap) => setInvite(snap.exists() ? ({ email: id, ...(snap.data() as Omit<TeamInvite, "email">) }) : null),
      () => {}
    );
  }, [email]);
  return invite;
}

export async function acceptInvite(email: string, memberUid: string, memberName: string): Promise<void> {
  await updateDoc(doc(db, "companyInvites", email.trim().toLowerCase()), {
    status: "accepted",
    memberUid,
    memberName: memberName || "Teammate",
  });
}

export async function declineInvite(email: string): Promise<void> {
  await updateDoc(doc(db, "companyInvites", email.trim().toLowerCase()), { status: "declined" });
}
