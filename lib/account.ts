"use client";

import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./firebaseClient";
import type { PublicSite, SiteDesign } from "./site";
import { LEGACY_TEMPLATE_OF, WEB_FONTS } from "./themes";

/**
 * Signed-in web account layer — the website talks to the SAME Firestore the app
 * uses (users/{uid}, emailRoles/{email}, publicProfiles/{handle}), via the client
 * SDK under the same security rules. Content is authored in the app; the web can
 * read the profile and publish/design the public page.
 */

/** The slice of the app's users/{uid} doc the website needs. */
export interface AppProfile {
  role?: "seeker" | "recruiter";
  /** recruiter-only */
  companyName?: string;
  /** teammate accounts: uid of the company (owner) they belong to */
  companyId?: string;
  teamRole?: string;
  fullName?: string;
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  photoUri?: string;
  publicHandle?: string;
  skills?: string[];
  languages?: string[];
  experience?: { id?: string; role: string; company: string; period?: string; description?: string }[];
  education?: { id?: string; degree: string; school: string; year?: string }[];
  certificates?: { id?: string; name: string; issuer?: string; year?: string }[];
  projects?: { id?: string; title: string; description?: string }[];
  resumes?: { id?: string; filename: string; url?: string; isDefault?: boolean }[];
  /** resume-builder preferences (mirrors the app) */
  resumeTemplate?: string;
  resumeAccent?: string;
  resumePhotoOn?: boolean;
  resumeFont?: string;
  resumeFontScale?: number;
}

export async function googleSignIn(): Promise<User> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  return cred.user;
}

export function webSignOut() {
  return signOut(auth);
}

/** Read my app profile without creating anything (recruiter portal gate). */
export async function fetchProfile(uid: string): Promise<AppProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as AppProfile) : null;
}

/** Update my own users/{uid} doc (owner-only by rules). */
export async function updateMyProfile(uid: string, partial: Record<string, unknown>): Promise<void> {
  await updateDoc(doc(db, "users", uid), partial);
}

/* ---- profile photo ---- */

/** Downscale an image file to a square-ish JPEG so profile photos stay small. */
async function downscaleImage(file: File, maxSide = 640): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("That file doesn't look like an image."));
      img.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process the image."))), "image/jpeg", 0.85)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Upload a new profile photo, save its URL to users/{uid}.photoUri, return the URL. */
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const blob = await downscaleImage(file);
  const photoRef = ref(storage, `profilePhotos/${uid}.jpg`);
  await uploadBytes(photoRef, blob, { contentType: "image/jpeg" });
  const photoUri = await getDownloadURL(photoRef);
  await updateMyProfile(uid, { photoUri });
  return photoUri;
}

/** Remove the profile photo (clears photoUri; storage delete is best-effort). */
export async function removeProfilePhoto(uid: string): Promise<void> {
  await updateMyProfile(uid, { photoUri: "" });
  await deleteObject(ref(storage, `profilePhotos/${uid}.jpg`)).catch(() => {});
}

/** Load my app profile; creates a starter seeker account (+ role registry entry,
 *  same one-role-per-email invariant as the app) for brand-new Google users. */
export async function ensureAccount(user: User): Promise<AppProfile> {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return snap.data() as AppProfile;

  const em = (user.email ?? "").toLowerCase();
  if (em) {
    const roleRef = doc(db, "emailRoles", em);
    const existingRole = await getDoc(roleRef).catch(() => null);
    if (existingRole?.exists() && existingRole.data().role !== "seeker") {
      throw new Error(`This email is registered as a ${existingRole.data().role}. Recruiters manage their page from the app.`);
    }
    if (!existingRole?.exists()) await setDoc(roleRef, { role: "seeker", uid: user.uid, createdAt: serverTimestamp() });
  }

  const starter: AppProfile = {
    role: "seeker",
    fullName: user.displayName ?? "",
    headline: "",
    phone: "",
    location: "",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    certificates: [],
    projects: [],
  };
  await setDoc(userRef, { ...starter, onboarded: false, preferredCategories: [], experienceLevel: "", resumes: [] });
  return starter;
}

/* ---- handles ---- */

export function suggestHandle(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
}

export function isValidHandle(h: string): boolean {
  return /^[a-z0-9][a-z0-9-]{2,29}$/.test(h);
}

/** true = free to claim (or already mine). */
export async function isHandleAvailable(handle: string, myUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "publicProfiles", handle));
  return !snap.exists() || snap.data()?.uid === myUid;
}

export async function loadMySite(handle: string): Promise<PublicSite | null> {
  const snap = await getDoc(doc(db, "publicProfiles", handle));
  return snap.exists() ? (snap.data() as PublicSite) : null;
}

/* ---- publishing (mirrors the app's siteDocFromProfile) ---- */

export interface PublishChoices {
  design: SiteDesign;
  gallery: string[];
  showEmail: boolean;
  showPhone: boolean;
  discoverable: boolean;
  email: string;
}

/** Strip undefined recursively — Firestore rejects undefined field values. */
function clean<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function buildSiteDoc(uid: string, handle: string, p: AppProfile, c: PublishChoices): Record<string, unknown> {
  const fontDef = WEB_FONTS.find((f) => f.id === c.design.font);
  const legacyFont = fontDef?.serif ? "serif" : "modern";
  return clean({
    uid,
    handle,
    name: p.fullName ?? "",
    headline: p.headline ?? "",
    summary: p.summary ?? "",
    location: p.location ?? "",
    role: p.role ?? "seeker",
    skills: p.skills ?? [],
    languages: p.languages ?? [],
    experience: (p.experience ?? []).map((e) => ({ role: e.role, company: e.company, period: e.period, description: e.description })),
    education: (p.education ?? []).map((e) => ({ degree: e.degree, school: e.school, year: e.year })),
    certificates: (p.certificates ?? []).map((x) => ({ name: x.name, issuer: x.issuer, year: x.year })),
    projects: (p.projects ?? []).map((x) => ({ title: x.title, description: x.description })),
    photoUri: p.photoUri,
    gallery: c.gallery,
    template: LEGACY_TEMPLATE_OF[c.design.id] ?? "aurora",
    font: legacyFont,
    design: c.design,
    email: c.showEmail ? c.email : "",
    phone: c.showPhone ? p.phone ?? "" : "",
    showEmail: c.showEmail,
    showPhone: c.showPhone && !!p.phone,
    discoverable: c.discoverable,
    noindex: !c.discoverable,
    published: true,
  });
}

/** Create/overwrite my site at `handle`; free the previous handle if it changed. */
export async function publishSite(siteDoc: Record<string, unknown>, uid: string, handle: string, previousHandle?: string): Promise<void> {
  await setDoc(doc(db, "publicProfiles", handle), { ...siteDoc, updatedAt: serverTimestamp() });
  await updateDoc(doc(db, "users", uid), { publicHandle: handle }).catch(() => {});
  if (previousHandle && previousHandle !== handle) {
    await deleteDoc(doc(db, "publicProfiles", previousHandle)).catch(() => {});
  }
}

export async function setPublished(handle: string, published: boolean): Promise<void> {
  await updateDoc(doc(db, "publicProfiles", handle), { published, updatedAt: serverTimestamp() });
}
