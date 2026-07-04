"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseClient";

/**
 * Seeker data layer for the web portal — the SAME Firestore collections and
 * document shapes the React Native app uses (jobs, jobApplications,
 * users/{uid}/savedJobs, threads/{id}/messages), so both clients stay in
 * perfect sync. Keep shapes in lockstep with the app's src/lib/*.
 */

/* ---------------- jobs ---------------- */

export interface ScreeningQuestion {
  id: string;
  text: string;
  required: boolean;
}

export interface JobDoc {
  id: string;
  employerId: string;
  companyName: string;
  title: string;
  category: string;
  location: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  experienceLevel: string;
  jobType?: string;
  description?: string;
  status: "live" | "pending" | "closed";
  applicants?: number;
  questions?: ScreeningQuestion[];
  postedAt?: Timestamp | null;
}

export function timeAgo(ts?: Timestamp | null): string {
  if (!ts?.toMillis) return "just now";
  const diff = Date.now() - ts.toMillis();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "";
  const f = (n: number) => n.toLocaleString("en-IN");
  return `₹${f(min ?? 0)}–${f(max ?? 0)}/mo`;
}

/** Skill-overlap match score (55–98) against title/category/description; null when
 *  there's no meaningful signal — never show a made-up number. */
export function matchScore(skills: string[] | undefined, job: JobDoc): number | null {
  if (!skills?.length) return null;
  const hay = `${job.title} ${job.category} ${job.description ?? ""}`.toLowerCase();
  const hits = skills.filter((s) => s.length > 1 && hay.includes(s.toLowerCase())).length;
  if (!hits) return null;
  const score = 55 + Math.round((hits / Math.min(skills.length, 8)) * 43);
  return Math.min(98, score);
}

/** True when the listing reads as remote/hybrid-friendly. */
export function isRemote(job: JobDoc): boolean {
  return /remote|hybrid|work from home|wfh/i.test(`${job.location} ${job.jobType ?? ""} ${job.title}`);
}

export function useLiveJobs(): { jobs: JobDoc[]; loading: boolean } {
  const [jobs, setJobs] = useState<JobDoc[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "jobs"), where("status", "==", "live"));
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
  }, []);
  return { jobs, loading };
}

export function useJob(id?: string): { job: JobDoc | null; loading: boolean } {
  const [job, setJob] = useState<JobDoc | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      doc(db, "jobs", id),
      (snap) => {
        setJob(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<JobDoc, "id">) }) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [id]);
  return { job, loading };
}

/* ---------------- saved jobs (app-compatible snapshot shape) ---------------- */

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "CO";
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? "")).toUpperCase();
}

/** The app's `Job` display shape — stored whole under users/{uid}/savedJobs/{jobId}. */
export interface SavedJobSnapshot {
  id: string;
  title: string;
  company: { id: string; name: string; verified: boolean; initials: string };
  category: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  postedAgo: string;
  employmentType?: string;
}

export function jobToSnapshot(d: JobDoc): SavedJobSnapshot {
  return {
    id: d.id,
    title: d.title,
    company: { id: d.employerId, name: d.companyName || "Company", verified: true, initials: companyInitials(d.companyName || "Company") },
    category: d.category,
    location: d.location,
    salaryMin: d.salaryMin ?? 0,
    salaryMax: d.salaryMax ?? 0,
    experience: d.experienceLevel || "Fresher",
    postedAgo: timeAgo(d.postedAt),
    employmentType: d.jobType || undefined,
  };
}

export interface SavedEntry extends SavedJobSnapshot {
  /** epoch ms when saved (the app writes `savedAt: Date.now()`) */
  savedAt?: number;
}

export function useSavedJobs(uid?: string): { saved: SavedEntry[]; ids: Record<string, boolean>; loading: boolean } {
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [ids, setIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    return onSnapshot(
      collection(db, "users", uid, "savedJobs"),
      (snap) => {
        const list: SavedEntry[] = [];
        const map: Record<string, boolean> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          const j = data.job as SavedJobSnapshot | undefined;
          if (j) list.push({ ...j, savedAt: typeof data.savedAt === "number" ? data.savedAt : undefined });
          map[d.id] = true;
        });
        list.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
        setSaved(list);
        setIds(map);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [uid]);
  return { saved, ids, loading };
}

export async function toggleSaveJob(uid: string, job: JobDoc, currentlySaved: boolean): Promise<void> {
  const ref = doc(db, "users", uid, "savedJobs", job.id);
  if (currentlySaved) {
    await deleteDoc(ref);
    return;
  }
  // Firestore rejects undefined — the JSON round-trip strips it (same as the app)
  const clean = JSON.parse(JSON.stringify(jobToSnapshot(job)));
  await setDoc(ref, { job: clean, savedAt: Date.now() });
}

export async function unsaveJob(uid: string, jobId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "savedJobs", jobId)).catch(() => {});
}

/* ---------------- applications ---------------- */

export type StatusKey = "Applied" | "Viewed" | "Shortlisted" | "Interview" | "Offer" | "Hired" | "Rejected" | "Withdrawn";
export const PIPELINE: StatusKey[] = ["Applied", "Viewed", "Shortlisted", "Interview", "Offer", "Hired"];

/** Status pill colors (mirrors the app's statusColor semantics). */
export function statusStyle(s: StatusKey): { fg: string; bg: string } {
  switch (s) {
    case "Viewed":
      return { fg: "#2563EB", bg: "#DBEAFE" };
    case "Shortlisted":
      return { fg: "#5B4BFF", bg: "#ECEAFF" };
    case "Interview":
      return { fg: "#CA8A04", bg: "#FEF9C3" };
    case "Offer":
    case "Hired":
      return { fg: "#16A34A", bg: "#DCFCE7" };
    case "Rejected":
      return { fg: "#DC2626", bg: "#FEE2E2" };
    default:
      return { fg: "#6B7280", bg: "#F3F4F6" };
  }
}

export type AnswerValue = "yes" | "no" | "skipped";

export interface ApplicationDoc {
  id: string;
  jobId: string;
  employerId: string;
  seekerUid: string;
  seekerName: string;
  seekerHeadline?: string;
  jobTitle: string;
  companyName?: string;
  resumeName?: string;
  resumeUrl?: string;
  coverLetter?: string;
  skills?: string[];
  answers?: Record<string, AnswerValue>;
  status: StatusKey;
  appliedAt?: Timestamp | null;
}

export function useMyApplications(uid?: string): { apps: ApplicationDoc[]; loading: boolean } {
  const [apps, setApps] = useState<ApplicationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "jobApplications"), where("seekerUid", "==", uid));
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
  }, [uid]);
  return { apps, loading };
}

export interface ApplyInput {
  job: JobDoc;
  seekerUid: string;
  seekerName: string;
  seekerHeadline?: string;
  resumeName?: string;
  resumeUrl?: string;
  coverLetter?: string;
  skills?: string[];
  answers?: Record<string, AnswerValue>;
}

/** Creates the exact jobApplications doc the app's apply wizard writes. */
export async function applyToJob(input: ApplyInput): Promise<void> {
  await addDoc(collection(db, "jobApplications"), {
    jobId: input.job.id,
    employerId: input.job.employerId,
    seekerUid: input.seekerUid,
    seekerName: input.seekerName || "Job seeker",
    seekerHeadline: input.seekerHeadline ?? "",
    jobTitle: input.job.title,
    companyName: input.job.companyName ?? "",
    resumeName: input.resumeName ?? "",
    resumeUrl: input.resumeUrl ?? "",
    coverLetter: input.coverLetter ?? "",
    skills: input.skills ?? [],
    answers: input.answers ?? {},
    status: "Applied",
    appliedAt: serverTimestamp(),
  });
  await unsaveJob(input.seekerUid, input.job.id);
}

/* ---------------- messaging ---------------- */

export interface Thread {
  id: string;
  participants: string[];
  seekerUid: string;
  recruiterUid: string;
  seekerName: string;
  companyName: string;
  jobTitle?: string;
  applicationId?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp | null;
}

export interface Message {
  id: string;
  from: string;
  text: string;
  sentAt?: Timestamp | null;
}

export function useThreads(uid?: string): { threads: Thread[]; loading: boolean } {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "threads"), where("participants", "array-contains", uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Thread, "id">) }));
        list.sort((a, b) => (b.lastMessageAt?.toMillis?.() ?? 0) - (a.lastMessageAt?.toMillis?.() ?? 0));
        setThreads(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, [uid]);
  return { threads, loading };
}

export function useMessages(threadId?: string): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "threads", threadId, "messages"), orderBy("sentAt", "asc"));
    return onSnapshot(q, (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))));
  }, [threadId]);
  return messages;
}

export async function sendMessage(threadId: string, from: string, text: string): Promise<void> {
  const t = text.trim();
  if (!t) return;
  await addDoc(collection(db, "threads", threadId, "messages"), { from, text: t, sentAt: serverTimestamp() });
  await updateDoc(doc(db, "threads", threadId), { lastMessage: t, lastMessageAt: serverTimestamp() });
}

/** Create the thread if it doesn't exist; returns its id (seekerUid__recruiterUid). */
export async function openThread(p: {
  seekerUid: string;
  recruiterUid: string;
  seekerName: string;
  companyName: string;
  jobTitle?: string;
  applicationId?: string;
}): Promise<string> {
  const id = `${p.seekerUid}__${p.recruiterUid}`;
  await setDoc(
    doc(db, "threads", id),
    {
      participants: [p.seekerUid, p.recruiterUid],
      seekerUid: p.seekerUid,
      recruiterUid: p.recruiterUid,
      seekerName: p.seekerName || "Job seeker",
      companyName: p.companyName || "Company",
      jobTitle: p.jobTitle ?? "",
      applicationId: p.applicationId ?? "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return id;
}
