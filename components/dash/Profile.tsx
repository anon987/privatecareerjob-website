"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useDash } from "./Shell";
import { card } from "./bits";
import ProfileAssistant from "./ai/ProfileAssistant";
import { removeProfilePhoto, updateMyProfile, uploadProfilePhoto } from "@/lib/account";

/**
 * Job-seeker Profile editor — writes the same users/{uid} fields the app reads
 * (name, headline, contact, skills, languages, experience, education, projects,
 * certificates). Saving refreshes the shared context so Home + My page update.
 */

const input =
  "w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition";

type Exp = { role: string; company: string; period: string; description: string };
type Edu = { degree: string; school: string; year: string };
type Cert = { name: string; issuer: string; year: string };
type Proj = { title: string; description: string };

function initials(name: string, email?: string): string {
  const parts = (name || email || "?").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ---------------- tag editor (skills / languages) ---------------- */

function TagField({ label, hint, placeholder, tags, setTags }: { label: string; hint: string; placeholder: string; tags: string[]; setTags: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) setTags(Array.from(new Set([...tags, ...parts])));
    setDraft("");
  };
  return (
    <section className={card}>
      <h2 className="text-[16px] font-bold">{label}</h2>
      <p className="text-[12.5px] text-ink-3 mt-1">{hint}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-tonal text-brand text-[12.5px] font-bold">
              {t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`} className="text-brand/60 hover:text-brand text-[15px] leading-none">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={input}
        />
        <button type="button" onClick={add} className="shrink-0 inline-flex items-center min-h-12 px-4 rounded-2xl border border-line hover:bg-sunken font-bold text-[13px] transition cursor-pointer">
          Add
        </button>
      </div>
    </section>
  );
}

/* ---------------- repeatable object list (experience / education / …) ---------------- */

function ListEditor<T extends Record<string, string>>({
  label,
  hint,
  items,
  setItems,
  blank,
  fields,
}: {
  label: string;
  hint: string;
  items: T[];
  setItems: (v: T[]) => void;
  blank: T;
  fields: { key: keyof T; placeholder: string; textarea?: boolean; full?: boolean }[];
}) {
  const patch = (i: number, key: keyof T, value: string) => setItems(items.map((x, xi) => (xi === i ? { ...x, [key]: value } : x)));
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold">{label}</h2>
        <button type="button" onClick={() => setItems([...items, { ...blank }])} className="text-[13px] font-bold text-brand hover:text-brand-pressed cursor-pointer">
          + Add
        </button>
      </div>
      <p className="text-[12.5px] text-ink-3 mt-1">{hint}</p>
      {items.length === 0 ? (
        <p className="text-[13.5px] text-ink-2 mt-3">Nothing added yet.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-line p-4">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={String(f.key)} className={f.full ? "sm:col-span-2" : ""}>
                    {f.textarea ? (
                      <textarea rows={2} value={it[f.key]} onChange={(e) => patch(i, f.key, e.target.value)} placeholder={f.placeholder} className={`${input} min-h-0 py-3 resize-y`} />
                    ) : (
                      <input value={it[f.key]} onChange={(e) => patch(i, f.key, e.target.value)} placeholder={f.placeholder} className={input} />
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setItems(items.filter((_, xi) => xi !== i))} className="mt-2.5 text-[12.5px] font-bold text-red-500 hover:text-red-600 cursor-pointer">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Profile() {
  const { user, profile, refresh } = useDash();

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [summary, setSummary] = useState(profile.summary ?? "");
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [experience, setExperience] = useState<Exp[]>((profile.experience ?? []).map((e) => ({ role: e.role ?? "", company: e.company ?? "", period: e.period ?? "", description: e.description ?? "" })));
  const [education, setEducation] = useState<Edu[]>((profile.education ?? []).map((e) => ({ degree: e.degree ?? "", school: e.school ?? "", year: e.year ?? "" })));
  const [projects, setProjects] = useState<Proj[]>((profile.projects ?? []).map((p) => ({ title: p.title ?? "", description: p.description ?? "" })));
  const [certificates, setCertificates] = useState<Cert[]>((profile.certificates ?? []).map((c) => ({ name: c.name ?? "", issuer: c.issuer ?? "", year: c.year ?? "" })));

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const changePhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await uploadProfilePhoto(user.uid, file);
      await refresh().catch(() => {});
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not upload the photo — please try again.");
    } finally {
      setPhotoBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError("");
    try {
      await removeProfilePhoto(user.uid);
      await refresh().catch(() => {});
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not remove the photo — please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  /** The exact object we persist — also used for the dirty check. */
  const build = () => ({
    fullName: fullName.trim(),
    headline: headline.trim(),
    location: location.trim(),
    phone: phone.trim(),
    summary: summary.trim(),
    skills: skills.map((s) => s.trim()).filter(Boolean),
    languages: languages.map((s) => s.trim()).filter(Boolean),
    experience: experience.map((e) => ({ role: e.role.trim(), company: e.company.trim(), period: e.period.trim(), description: e.description.trim() })).filter((e) => e.role || e.company),
    education: education.map((e) => ({ degree: e.degree.trim(), school: e.school.trim(), year: e.year.trim() })).filter((e) => e.degree || e.school),
    projects: projects.map((p) => ({ title: p.title.trim(), description: p.description.trim() })).filter((p) => p.title),
    certificates: certificates.map((c) => ({ name: c.name.trim(), issuer: c.issuer.trim(), year: c.year.trim() })).filter((c) => c.name),
  });

  const serialized = JSON.stringify(build());
  const savedRef = useRef<string | null>(null);
  if (savedRef.current === null) savedRef.current = serialized;
  const dirty = serialized !== savedRef.current;

  // Live profile strength — mirrors the app's 9 checks (see Home).
  const checks: [string, boolean][] = [
    ["Name", !!fullName.trim()],
    ["Headline", !!headline.trim()],
    ["Phone", !!phone.trim()],
    ["Location", !!location.trim()],
    ["Skills", skills.length > 0],
    ["Experience", experience.some((e) => e.role || e.company)],
    ["Education", education.some((e) => e.degree || e.school)],
    ["Languages", languages.length > 0],
    ["Projects", projects.some((p) => p.title)],
  ];
  const pct = Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100);

  // Same 9 checks against the SAVED profile — the AI coach reads saved data,
  // so its suggestions stay stable while the user types and refresh on save.
  const savedChecks: [string, boolean][] = [
    ["Name", !!profile.fullName],
    ["Headline", !!profile.headline],
    ["Phone", !!profile.phone],
    ["Location", !!profile.location],
    ["Skills", (profile.skills?.length ?? 0) > 0],
    ["Experience", (profile.experience?.length ?? 0) > 0],
    ["Education", (profile.education?.length ?? 0) > 0],
    ["Languages", (profile.languages?.length ?? 0) > 0],
    ["Projects", (profile.projects?.length ?? 0) > 0],
  ];
  const savedPct = Math.round((savedChecks.filter(([, ok]) => ok).length / savedChecks.length) * 100);
  const savedMissing = savedChecks.filter(([, ok]) => !ok).map(([label]) => label);

  const save = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const payload = build();
      await updateMyProfile(user.uid, payload);
      savedRef.current = JSON.stringify(payload);
      await refresh().catch(() => {});
      setNote("Saved ✓ — your changes are live.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[860px] space-y-5 pb-24">
      <div className="rise flex flex-wrap items-center gap-4">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => changePhoto(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          disabled={photoBusy}
          aria-label={profile.photoUri ? "Change profile photo" : "Upload profile photo"}
          title={profile.photoUri ? "Change profile photo" : "Upload profile photo"}
          className="group relative grid place-items-center w-16 h-16 rounded-2xl bg-brand-tonal text-brand text-[20px] font-extrabold shrink-0 overflow-hidden cursor-pointer focus-visible:ring-4 focus-visible:ring-brand/20 disabled:cursor-wait"
        >
          {profile.photoUri ? (
            <img src={profile.photoUri} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(fullName, user.email ?? undefined)
          )}
          <span className={`absolute inset-0 grid place-items-center bg-black/45 text-white text-[10.5px] font-bold transition-opacity ${photoBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
            {photoBusy ? "…" : "📷 Change"}
          </span>
        </button>
        <div className="min-w-0">
          <h1 className="text-[24px] font-extrabold tracking-[-0.4px] truncate">{fullName || "Your profile"}</h1>
          <p className="text-ink-2 text-[14px] truncate">{headline || "Add a headline recruiters will see first"}</p>
          <div className="mt-1 flex items-center gap-3 text-[12.5px]">
            <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoBusy} className="font-bold text-brand cursor-pointer disabled:opacity-50">
              {photoBusy ? "Uploading…" : profile.photoUri ? "Change photo" : "Upload photo"}
            </button>
            {profile.photoUri && !photoBusy && (
              <button type="button" onClick={removePhoto} className="font-bold text-ink-3 hover:text-red-500 cursor-pointer transition">
                Remove
              </button>
            )}
          </div>
          {photoError && <p className="text-[12.5px] font-semibold text-red-600 mt-1">{photoError}</p>}
        </div>
      </div>

      {/* profile strength */}
      <section className={`${card} rise-1`} aria-label="Profile strength">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-extrabold">Profile strength</h2>
          <span className="text-[15px] font-extrabold text-brand">{pct}%</span>
        </div>
        <div className="mt-2.5 h-2 rounded-full bg-sunken overflow-hidden">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {checks.map(([label, ok]) => (
            <span key={label} className={`px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${ok ? "bg-green-50 text-green-700" : "border border-line text-ink-2"}`}>
              {ok ? "✓" : "○"} {label}
            </span>
          ))}
        </div>
      </section>

      {/* AI coach — fills drafts straight into the form; user reviews and saves */}
      <ProfileAssistant
        uid={user.uid}
        profile={profile}
        completenessPct={savedPct}
        missing={savedMissing}
        onApplyHeadline={setHeadline}
        onApplySummary={setSummary}
        onAddSkill={(s) => setSkills((prev) => Array.from(new Set([...prev, s])))}
      />

      {/* basics */}
      <section className={card}>
        <h2 className="text-[16px] font-bold">Basics</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Prashant Kumar" className={input} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Headline</label>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Frontend Developer · React" className={input} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" className={input} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Summary</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="A short introduction — what you do and what you're looking for." className={`${input} min-h-0 py-3 resize-y`} />
          </div>
        </div>
      </section>

      <TagField label="Skills" hint="Press Enter or comma to add. These power your job-match scores." placeholder="e.g. React, TypeScript, SQL" tags={skills} setTags={setSkills} />
      <TagField label="Languages" hint="Languages you can work in." placeholder="e.g. English, Hindi" tags={languages} setTags={setLanguages} />

      <ListEditor<Exp>
        label="Experience"
        hint="Your most relevant roles first."
        items={experience}
        setItems={setExperience}
        blank={{ role: "", company: "", period: "", description: "" }}
        fields={[
          { key: "role", placeholder: "Role — e.g. Frontend Developer" },
          { key: "company", placeholder: "Company" },
          { key: "period", placeholder: "Period — e.g. 2022 – Present" },
          { key: "description", placeholder: "What you did and achieved", textarea: true, full: true },
        ]}
      />

      <ListEditor<Edu>
        label="Education"
        hint="Degrees, diplomas and courses."
        items={education}
        setItems={setEducation}
        blank={{ degree: "", school: "", year: "" }}
        fields={[
          { key: "degree", placeholder: "Degree — e.g. B.Tech, Computer Science" },
          { key: "school", placeholder: "School / University" },
          { key: "year", placeholder: "Year — e.g. 2021", full: true },
        ]}
      />

      <ListEditor<Proj>
        label="Projects"
        hint="Work you're proud of."
        items={projects}
        setItems={setProjects}
        blank={{ title: "", description: "" }}
        fields={[
          { key: "title", placeholder: "Project title", full: true },
          { key: "description", placeholder: "What it is and your role", textarea: true, full: true },
        ]}
      />

      <ListEditor<Cert>
        label="Certificates"
        hint="Certifications and credentials."
        items={certificates}
        setItems={setCertificates}
        blank={{ name: "", issuer: "", year: "" }}
        fields={[
          { key: "name", placeholder: "Certificate name" },
          { key: "issuer", placeholder: "Issuer" },
          { key: "year", placeholder: "Year", full: true },
        ]}
      />

      <p className="text-[12.5px] text-ink-3">
        Your profile feeds your <Link href="/dashboard/resume" className="font-bold text-brand">Resume builder</Link> and your public page. After editing, publish or republish from{" "}
        <Link href="/dashboard/website" className="font-bold text-brand">My page</Link>.
      </p>

      {/* sticky save bar */}
      <div className="sticky bottom-0 -mx-5 px-5 py-3 border-t border-line bg-white/90 backdrop-blur">
        <div className="max-w-[860px] flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition disabled:opacity-50 cursor-pointer press"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
          {dirty && !busy && <span className="text-[13px] font-semibold text-ink-3">Unsaved changes</span>}
          {note && <span className="text-[13.5px] font-semibold text-green-600">{note}</span>}
          {error && <span className="text-[13.5px] font-semibold text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}
