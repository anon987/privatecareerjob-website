import { adminDb } from "@/lib/admin/firebaseAdmin";
import { verifyAdmin, NOT_ADMIN } from "@/lib/admin/adminGuard";
import { Timestamp } from "firebase-admin/firestore";

/** Dashboard analytics: entity counts + 7-day application/job momentum. */
export async function GET(req: Request): Promise<Response> {
  if (!(await verifyAdmin(req))) return NOT_ADMIN;
  try {
    const db = adminDb();
    const weekAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 3600 * 1000);
    const [seekers, recruiters, jobs, liveJobs, apps, appsWeek, jobsWeek, threads, contacts, contactsNew, blogs] =
      await Promise.all([
        db.collection("users").where("role", "==", "seeker").count().get(),
        db.collection("users").where("role", "==", "recruiter").count().get(),
        db.collection("jobs").count().get(),
        db.collection("jobs").where("status", "==", "live").count().get(),
        db.collection("jobApplications").count().get(),
        db.collection("jobApplications").where("appliedAt", ">=", weekAgo).count().get(),
        db.collection("jobs").where("postedAt", ">=", weekAgo).count().get(),
        db.collection("threads").count().get(),
        db.collection("contactMessages").count().get(),
        db.collection("contactMessages").where("status", "==", "new").count().get(),
        db.collection("blogPosts").count().get(),
      ]);
    return Response.json({
      seekers: seekers.data().count,
      recruiters: recruiters.data().count,
      jobs: jobs.data().count,
      liveJobs: liveJobs.data().count,
      applications: apps.data().count,
      applicationsThisWeek: appsWeek.data().count,
      jobsThisWeek: jobsWeek.data().count,
      threads: threads.data().count,
      contacts: contacts.data().count,
      contactsNew: contactsNew.data().count,
      blogPosts: blogs.data().count,
    });
  } catch (e) {
    console.error("[admin/stats]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Could not load stats — check service-account Firestore access." }, { status: 502 });
  }
}
