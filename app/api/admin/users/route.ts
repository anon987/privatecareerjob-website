import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";

/** List seeker or recruiter accounts (basic, non-sensitive fields only). */
export async function GET(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  const url = new URL(req.url);
  const role = url.searchParams.get("role") === "recruiter" ? "recruiter" : "seeker";
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  try {
    const snap = await adminDb().collection("users").where("role", "==", role).limit(limit).get();
    const users = snap.docs.map((d) => {
      const u = d.data();
      return {
        uid: d.id,
        fullName: u.fullName ?? "",
        headline: u.headline ?? "",
        location: u.location ?? "",
        phone: u.phone ?? "",
        experienceLevel: u.experienceLevel ?? "",
        skills: Array.isArray(u.skills) ? u.skills.slice(0, 10) : [],
        companyName: u.companyName ?? "",
        companyVerified: u.companyVerified ?? false,
        onboarded: !!u.onboarded,
        resumes: Array.isArray(u.resumes) ? u.resumes.length : 0,
      };
    });
    return Response.json({ users });
  } catch (e) {
    console.error("[admin/users]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Could not load users." }, { status: 502 });
  }
}
