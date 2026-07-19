"use client";

import { useEffect, useState } from "react";
import { callAdmin } from "@/lib/admin/client";

interface AdminUser {
  uid: string;
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  experienceLevel: string;
  skills: string[];
  companyName: string;
  companyVerified: boolean;
  onboarded: boolean;
  resumes: number;
}

/** Shared table for the seeker / recruiter data sections. */
export function UsersTable({ role }: { role: "seeker" | "recruiter" }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<{ users: AdminUser[] }>(`users?role=${role}&limit=500`)
      .then((d) => setUsers(d.users))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? users.filter((u) =>
        [u.fullName, u.location, u.companyName, u.headline, ...u.skills].join(" ").toLowerCase().includes(needle)
      )
    : users;

  return (
    <div>
      <h1 className="text-3xl font-bold">{role === "seeker" ? "Job seekers" : "Recruiters"}</h1>
      <p className="mt-1 opacity-60">{users.length} accounts</p>
      <input
        className="mt-6 w-full max-w-md rounded-xl border border-black/15 px-4 py-2.5"
        placeholder={`Search ${role === "seeker" ? "name, skill, city…" : "company, name, city…"}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {err ? <p className="mt-6 text-red-600">{err}</p> : null}
      {loading ? <p className="mt-6 opacity-60">Loading…</p> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-black/10 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              {role === "recruiter" ? <th className="px-4 py-3">Company</th> : <th className="px-4 py-3">Headline</th>}
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Phone</th>
              {role === "seeker" ? (
                <>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Resumes</th>
                </>
              ) : (
                <th className="px-4 py-3">Verified</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.uid} className="border-b border-black/5 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium">{u.fullName || <span className="opacity-40">—</span>}</td>
                {role === "recruiter" ? (
                  <td className="px-4 py-3">{u.companyName || <span className="opacity-40">—</span>}</td>
                ) : (
                  <td className="max-w-56 truncate px-4 py-3">{u.headline || <span className="opacity-40">—</span>}</td>
                )}
                <td className="px-4 py-3">{u.location || <span className="opacity-40">—</span>}</td>
                <td className="px-4 py-3">{u.phone || <span className="opacity-40">—</span>}</td>
                {role === "seeker" ? (
                  <>
                    <td className="px-4 py-3">{u.experienceLevel || <span className="opacity-40">—</span>}</td>
                    <td className="max-w-64 truncate px-4 py-3">{u.skills.join(", ") || <span className="opacity-40">—</span>}</td>
                    <td className="px-4 py-3">{u.resumes}</td>
                  </>
                ) : (
                  <td className="px-4 py-3">{u.companyVerified ? "✅" : "—"}</td>
                )}
              </tr>
            ))}
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center opacity-50">No matches.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
