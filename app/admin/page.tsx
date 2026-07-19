"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { callAdmin } from "@/lib/admin/client";

interface Stats {
  seekers: number;
  recruiters: number;
  jobs: number;
  liveJobs: number;
  applications: number;
  applicationsThisWeek: number;
  jobsThisWeek: number;
  threads: number;
  contacts: number;
  contactsNew: number;
  blogPosts: number;
}

function Tile({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-black/10 bg-white p-5 transition hover:shadow-sm">
      <p className="text-sm opacity-60">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-violet-600">{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    callAdmin<Stats>("stats").then(setStats).catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-600">{err}</p>;
  if (!stats) return <p className="opacity-60">Loading analytics…</p>;

  const total = stats.seekers + stats.recruiters || 1;
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-1 opacity-60">Platform analytics at a glance.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Job seekers" value={stats.seekers} href="/admin/seekers" />
        <Tile label="Recruiters" value={stats.recruiters} href="/admin/recruiters" />
        <Tile label="Live jobs" value={stats.liveJobs} sub={`${stats.jobs} total · +${stats.jobsThisWeek} this week`} href="/admin/jobs" />
        <Tile label="Applications" value={stats.applications} sub={`+${stats.applicationsThisWeek} this week`} />
        <Tile label="Conversations" value={stats.threads} />
        <Tile label="Contact messages" value={stats.contacts} sub={stats.contactsNew ? `${stats.contactsNew} new` : "all handled"} href="/admin/contacts" />
        <Tile label="Blog posts" value={stats.blogPosts} href="/admin/blogs" />
        <Tile label="Apps per live job" value={stats.liveJobs ? (stats.applications / stats.liveJobs).toFixed(1) : "—"} />
      </div>

      <div className="mt-10 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="font-semibold">Audience split</h2>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-neutral-100">
          <div className="bg-violet-600" style={{ width: `${(stats.seekers / total) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(stats.recruiters / total) * 100}%` }} />
        </div>
        <div className="mt-3 flex gap-6 text-sm">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-violet-600" />Seekers {stats.seekers}</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Recruiters {stats.recruiters}</span>
        </div>
      </div>
    </div>
  );
}
