import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Admin job listings: list every job on the platform; POST creates a live job
 * owned by the admin account (it appears in the app feed like any posting, and
 * applications land on the admin's account as the employer); PATCH flips status.
 */

interface JobInput {
  title?: string;
  companyName?: string;
  category?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceLevel?: string;
  jobType?: string;
  description?: string;
}

export async function GET(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const snap = await adminDb().collection("jobs").orderBy("postedAt", "desc").limit(300).get();
  const jobs = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    postedAt: d.get("postedAt")?.toMillis?.() ?? 0,
  }));
  return Response.json({ jobs });
}

export async function POST(req: Request): Promise<Response> {
  const admin = await verifyAdmin(req);
  if (!admin) return NOT_ADMIN;
  const b = (await req.json().catch(() => ({}))) as JobInput;
  if (!b.title?.trim() || !b.companyName?.trim() || !b.location?.trim()) {
    return Response.json({ error: "Title, company and location are required." }, { status: 400 });
  }
  const doc = {
    employerId: admin.uid,
    companyName: b.companyName.trim().slice(0, 120),
    title: b.title.trim().slice(0, 120),
    category: (b.category ?? "Other").slice(0, 60),
    location: b.location.trim().slice(0, 120),
    salaryMin: Number(b.salaryMin) || 0,
    salaryMax: Number(b.salaryMax) || 0,
    experienceLevel: (b.experienceLevel ?? "Fresher").slice(0, 40),
    jobType: (b.jobType ?? "Full-time").slice(0, 40),
    description: (b.description ?? "").slice(0, 20_000),
    questions: [],
    applicants: 0,
    status: "live",
    postedAt: FieldValue.serverTimestamp(),
    postedByAdmin: true,
  };
  const ref = await adminDb().collection("jobs").add(doc);
  return Response.json({ ok: true, id: ref.id });
}

export async function PATCH(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
  if (!id || !["live", "closed"].includes(status ?? "")) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  await adminDb().collection("jobs").doc(id).update({ status });
  return Response.json({ ok: true });
}
