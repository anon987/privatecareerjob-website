"use client";

import { useEffect, useState } from "react";
import { callAdmin } from "@/lib/admin/client";

interface AdminJob {
  id: string;
  title: string;
  companyName: string;
  category: string;
  location: string;
  salaryMin: number;
  salaryMax: number;
  experienceLevel: string;
  jobType: string;
  status: string;
  applicants: number;
  postedAt: number;
  postedByAdmin?: boolean;
}

const CATEGORIES = ["Retail", "Sales & Business Development", "BPO / Customer Support", "Telecalling", "Field Sales", "Banking / Finance", "Accounting", "Logistics / Supply Chain", "Delivery / Driver", "Warehouse / Operations", "IT / Software", "Data Entry / Back Office", "Human Resources", "Marketing / Digital Marketing", "Healthcare / Nursing", "Education / Teaching", "Hospitality / Hotel", "Manufacturing / Production", "Construction / Civil", "Security Guard", "Beauty / Wellness", "Engineering", "Design / Creative", "Receptionist / Front Office", "Mechanic / Technician", "Other"];
const EXPERIENCE = ["Fresher", "Less than 1 year", "1–2 years", "2–3 years", "3–5 years", "5–7 years", "7+ years"];
const TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary", "Freelance"];

const EMPTY = { title: "", companyName: "", category: "Other", location: "", salaryMin: "", salaryMax: "", experienceLevel: "Fresher", jobType: "Full-time", description: "" };

export default function AdminJobs() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = () => callAdmin<{ jobs: AdminJob[] }>("jobs").then((d) => setJobs(d.jobs)).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);

  const post = async () => {
    if (!form) return;
    setSaving(true);
    setErr("");
    try {
      await callAdmin("jobs", {
        method: "POST",
        body: { ...form, salaryMin: Number(form.salaryMin) || 0, salaryMax: Number(form.salaryMax) || 0 },
      });
      setForm(null);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not post job");
    } finally {
      setSaving(false);
    }
  };

  const flip = async (j: AdminJob) => {
    const status = j.status === "live" ? "closed" : "live";
    await callAdmin("jobs", { method: "PATCH", body: { id: j.id, status } }).catch(() => {});
    setJobs((all) => all.map((x) => (x.id === j.id ? { ...x, status } : x)));
  };

  if (form) {
    const set = (p: Partial<typeof EMPTY>) => setForm({ ...form, ...p });
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold">Post a job as admin</h1>
        <p className="mt-1 opacity-60">Goes live in the app feed immediately; applicants land on your admin account.</p>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-xl border border-black/15 px-4 py-2.5" placeholder="Job title *" value={form.title} onChange={(e) => set({ title: e.target.value })} />
          <input className="w-full rounded-xl border border-black/15 px-4 py-2.5" placeholder="Company name *" value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          <input className="w-full rounded-xl border border-black/15 px-4 py-2.5" placeholder="Location (City, State) *" value={form.location} onChange={(e) => set({ location: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <select className="rounded-xl border border-black/15 px-4 py-2.5" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="rounded-xl border border-black/15 px-4 py-2.5" value={form.jobType} onChange={(e) => set({ jobType: e.target.value })}>
              {TYPES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select className="rounded-xl border border-black/15 px-4 py-2.5" value={form.experienceLevel} onChange={(e) => set({ experienceLevel: e.target.value })}>
              {EXPERIENCE.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2">
              <input className="w-1/2 rounded-xl border border-black/15 px-3 py-2.5" placeholder="₹ min/mo" inputMode="numeric" value={form.salaryMin} onChange={(e) => set({ salaryMin: e.target.value.replace(/\D/g, "") })} />
              <input className="w-1/2 rounded-xl border border-black/15 px-3 py-2.5" placeholder="₹ max/mo" inputMode="numeric" value={form.salaryMax} onChange={(e) => set({ salaryMax: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          <textarea className="w-full rounded-xl border border-black/15 px-4 py-2.5" rows={8} placeholder="Job description" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          {err ? <p className="text-red-600">{err}</p> : null}
          <div className="flex gap-3">
            <button onClick={post} disabled={saving || !form.title || !form.companyName || !form.location} className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
              {saving ? "Posting…" : "Post job (live)"}
            </button>
            <button onClick={() => setForm(null)} className="rounded-xl border border-black/15 px-5 py-2.5 hover:bg-neutral-50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="mt-1 opacity-60">Every listing on the platform.</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="rounded-xl bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700">
          + Post job
        </button>
      </div>
      {err ? <p className="mt-6 text-red-600">{err}</p> : null}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Applicants</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-black/5 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">
                  {j.title}
                  {j.postedByAdmin ? <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-700">admin</span> : null}
                </td>
                <td className="px-4 py-3">{j.companyName}</td>
                <td className="px-4 py-3">{j.location}</td>
                <td className="px-4 py-3">{j.salaryMin || j.salaryMax ? `₹${j.salaryMin.toLocaleString("en-IN")}–₹${j.salaryMax.toLocaleString("en-IN")}` : "—"}</td>
                <td className="px-4 py-3">{j.applicants ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${j.status === "live" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>{j.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => flip(j)} className="rounded-lg border border-black/15 px-3 py-1 text-xs hover:bg-neutral-50">
                    {j.status === "live" ? "Close" : "Reopen"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
