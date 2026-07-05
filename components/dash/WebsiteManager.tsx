"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDash } from "./Shell";
import {
  suggestHandle,
  isValidHandle,
  isHandleAvailable,
  loadMySite,
  buildSiteDoc,
  publishSite,
  setPublished,
} from "@/lib/account";
import { ACCENTS, DESIGNS, WEB_FONTS } from "@/lib/themes";
import { SITE_ORIGIN, type SiteDesign } from "@/lib/site";

type Availability = "unknown" | "checking" | "free" | "taken" | "invalid";

/**
 * Web dashboard — sign in with Google and manage your portfolio page with the
 * same Firestore data the app uses: users/{uid} for content, publicProfiles for
 * the published page. Content editing stays in the app; design/publish live here.
 */
export default function WebsiteManager() {
  const { user, profile } = useDash();
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const [handle, setHandle] = useState("");
  const [claimed, setClaimed] = useState("");
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [design, setDesign] = useState<SiteDesign>({ id: "studio", accent: "#5B4BFF", font: "system", fontFamily: "Manrope" });
  const [gallery, setGallery] = useState<string[]>([]);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const checkSeq = useRef(0);

  // load the existing site once
  useEffect(() => {
    const h = profile.publicHandle ?? "";
    setClaimed(h);
    setHandle(h || suggestHandle(profile.fullName || user.displayName || ""));
    if (!h) return;
    loadMySite(h)
      .then((site) => {
        if (!site) return;
        setIsLive(site.published);
        setViews(site.views ?? 0);
        setGallery(site.gallery ?? []);
        setShowEmail(!!site.showEmail);
        setShowPhone(!!site.showPhone);
        setDiscoverable(!!site.discoverable);
        if (site.design) setDesign(site.design);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced handle availability
  useEffect(() => {
    if (!user) return;
    if (handle === claimed && claimed) {
      setAvailability("free");
      return;
    }
    if (!isValidHandle(handle)) {
      setAvailability(handle ? "invalid" : "unknown");
      return;
    }
    setAvailability("checking");
    const seq = ++checkSeq.current;
    const t = setTimeout(() => {
      isHandleAvailable(handle, user.uid)
        .then((free) => checkSeq.current === seq && setAvailability(free ? "free" : "taken"))
        .catch(() => checkSeq.current === seq && setAvailability("unknown"));
    }, 400);
    return () => clearTimeout(t);
  }, [handle, claimed, user]);

  const publish = async () => {
    if (!user || !profile) return;
    if (!isValidHandle(handle)) {
      setError("Pick a handle: 3–30 characters, lowercase letters, numbers, hyphens.");
      return;
    }
    setBusy(true);
    setError("");
    setNote("");
    try {
      if (!(await isHandleAvailable(handle, user.uid))) {
        setAvailability("taken");
        return;
      }
      const siteDoc = buildSiteDoc(user.uid, handle, profile, {
        design,
        gallery,
        showEmail,
        showPhone,
        discoverable,
        email: user.email ?? "",
      });
      await publishSite(siteDoc, user.uid, handle, claimed || undefined);
      setClaimed(handle);
      setIsLive(true);
      setNote("Published ✓ — your page is live.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!claimed) return;
    try {
      await setPublished(claimed, false);
      setIsLive(false);
      setNote("Unpublished — the page now shows as not found.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not unpublish.");
    }
  };

  const url = `${SITE_ORIGIN}/@${claimed || handle || "you"}`;
  const input = "w-full min-h-12 px-4 rounded-[14px] border border-line bg-paper outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/15 transition";
  const card = "bg-white border border-line rounded-3xl p-6 shadow-[0_10px_40px_rgba(17,24,39,0.05)]";

  /* ---------- signed in ---------- */
  const counts = [
    `${profile?.experience?.length ?? 0} experience`,
    `${profile?.skills?.length ?? 0} skills`,
    `${profile?.projects?.length ?? 0} projects`,
  ].join(" · ");

  const shareUrl = async () => {
    const text = `Check out my profile: ${url}`;
    if (navigator.share) await navigator.share({ title: profile.fullName ?? "My page", text, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setNote("Link copied ✓");
    }
  };

  return (
    <div className="max-w-[860px] space-y-5">
      <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">My page</h1>
      <>
        {/* hero: status + quick actions + analytics */}
        {claimed && (
          <section className={`${card} rise bg-[linear-gradient(135deg,rgba(91,75,255,0.05),transparent_55%)]`} aria-label="Page status">
            <div className="flex flex-wrap items-center gap-3">
              <span aria-hidden className="grid place-items-center w-11 h-11 rounded-2xl bg-brand text-white text-[18px] font-extrabold">@</span>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <b className="text-[16px]">@{claimed}</b>
                  <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold ${isLive ? "text-green-600" : "text-ink-3"}`}>
                    <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500" : "bg-ink-3"}`} /> {isLive ? "Live" : "Unpublished"}
                  </span>
                </div>
                <p className="text-[13px] text-ink-2 truncate">{url.replace("https://", "")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={`/@${claimed}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-10 px-4 rounded-full bg-accent hover:bg-accent-pressed text-ink text-[13px] font-bold transition press">
                  Preview
                </a>
                <button onClick={shareUrl} className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press">
                  Share
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(url).catch(() => {}); setNote("Link copied ✓"); }}
                  className="inline-flex items-center min-h-10 px-4 rounded-full border border-line hover:bg-sunken text-[13px] font-bold transition cursor-pointer press"
                >
                  Copy link
                </button>
              </div>
            </div>
            {/* analytics — views are real (rules-gated counter); the rest is architecture-ready */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { v: isLive ? String(views ?? 0) : "—", l: "Portfolio views", real: true },
                { v: "—", l: "Resume downloads", real: false },
                { v: "—", l: "Recruiter visits", real: false },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl bg-sunken px-4 py-3 text-center">
                  <div className="text-[20px] font-extrabold text-brand">{s.v}</div>
                  <div className="text-[11.5px] font-semibold text-ink-2">{s.l}</div>
                  {!s.real && <div className="text-[10px] text-ink-3">coming soon</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* profile content */}
        <section className={card}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-bold">{profile?.fullName || "Your profile"}</h2>
              <p className="text-ink-2 text-[14px] mt-0.5">{profile?.headline || "No headline yet"}</p>
              <p className="text-ink-3 text-[13px] mt-1.5">{counts}</p>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-brand-tonal text-brand text-[12px] font-bold whitespace-nowrap">
              {profile?.role === "recruiter" ? "Recruiter" : "Job seeker"}
            </span>
          </div>
          <p className="mt-4 text-[13px] text-ink-2 bg-sunken rounded-xl px-4 py-3">
            ✏️ Edit your name, skills, experience, education and projects on the{" "}
            <Link href="/dashboard/profile" className="font-bold text-brand">Profile</Link> tab — changes appear here when you republish.
          </p>
        </section>

        {/* website */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold">Your page</h2>
            {isLive && claimed && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Live
              </span>
            )}
          </div>

          {/* handle */}
          <div className="mt-4">
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Handle</label>
            <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="yourname" className={input} />
            <p className="mt-1.5 text-[13px] text-ink-3">{url.replace("https://", "")}</p>
            {availability === "checking" && <p className="text-[12.5px] text-ink-3 mt-0.5">Checking availability…</p>}
            {availability === "free" && handle && <p className="text-[12.5px] text-green-600 font-semibold mt-0.5">✓ Available</p>}
            {availability === "taken" && <p className="text-[12.5px] text-red-500 font-semibold mt-0.5">That handle is taken</p>}
            {availability === "invalid" && <p className="text-[12.5px] text-amber-600 font-semibold mt-0.5">3–30 chars: lowercase letters, numbers, hyphens</p>}
          </div>

          {/* design */}
          <div className="mt-5">
            <p className="text-[13px] font-semibold text-ink-2 mb-2">Design</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {DESIGNS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesign((x) => ({ ...x, id: d.id, accent: d.accent }))}
                  className={`text-left px-3 py-2.5 rounded-xl border text-[13px] font-semibold cursor-pointer transition ${
                    d.id === design.id ? "border-brand bg-brand-tonal" : "border-line hover:bg-sunken"
                  }`}
                >
                  <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ background: d.accent }} />
                  {d.name}
                  <span className="block text-[11px] font-medium text-ink-3">{d.field}</span>
                </button>
              ))}
            </div>
          </div>

          {/* accent + font */}
          <div className="mt-5 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[13px] font-semibold text-ink-2 mb-2">Accent</p>
              <div className="flex flex-wrap gap-2">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setDesign((x) => ({ ...x, accent: a.hex }))}
                    aria-label={`Accent ${a.name}`}
                    className={`w-8 h-8 rounded-full cursor-pointer ${a.hex === design.accent ? "ring-2 ring-offset-2 ring-brand" : ""}`}
                    style={{ background: a.hex }}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-[13px] font-semibold text-ink-2 mb-2">Font</p>
              <select
                value={design.font}
                onChange={(e) => {
                  const f = WEB_FONTS.find((x) => x.id === e.target.value)!;
                  setDesign((x) => ({ ...x, font: f.id, fontFamily: f.family }));
                }}
                className={`${input} min-h-11`}
              >
                {WEB_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.family}
                    {f.serif ? " (serif)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* visibility */}
          <div className="mt-5 space-y-2.5">
            <p className="text-[13px] font-semibold text-ink-2">Visibility</p>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[14px]">Show email <span className="text-ink-3">({user.email})</span></span>
              <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} className="w-5 h-5 accent-brand" />
            </label>
            <label className={`flex items-center justify-between gap-3 ${profile?.phone ? "cursor-pointer" : "opacity-50"}`}>
              <span className="text-[14px]">Show phone <span className="text-ink-3">({profile?.phone || "add in the app"})</span></span>
              <input type="checkbox" disabled={!profile?.phone} checked={showPhone && !!profile?.phone} onChange={(e) => setShowPhone(e.target.checked)} className="w-5 h-5 accent-brand" />
            </label>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[14px]">Show in search engines <span className="text-ink-3">(off = link-only)</span></span>
              <input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} className="w-5 h-5 accent-brand" />
            </label>
          </div>

          {/* actions */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={publish}
              disabled={busy || availability === "taken" || availability === "checking" || availability === "invalid"}
              className="inline-flex items-center min-h-12 px-6 rounded-2xl bg-accent hover:bg-accent-pressed text-ink font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Publishing…" : isLive ? "Republish changes" : "Publish my page"}
            </button>
            {isLive && claimed && (
              <>
                <a href={`/@${claimed}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-12 px-5 rounded-2xl border-[1.5px] border-brand text-brand hover:bg-brand-tonal font-bold transition">
                  View page
                </a>
                <button
                  onClick={() => { navigator.clipboard.writeText(url).catch(() => {}); setNote("Link copied ✓"); }}
                  className="inline-flex items-center min-h-12 px-5 rounded-2xl border border-line hover:bg-sunken font-bold transition cursor-pointer"
                >
                  Copy link
                </button>
                <button onClick={unpublish} className="inline-flex items-center min-h-12 px-5 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition cursor-pointer">
                  Unpublish
                </button>
              </>
            )}
          </div>
          {note && <p className="mt-3 text-[13.5px] font-semibold text-green-600">{note}</p>}
          {error && <div className="mt-3 rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm font-medium">{error}</div>}
          <p className="mt-4 text-[12.5px] text-ink-3">
            Tip: open your live page and use the ✎ Customize button to restyle it with a live preview.
          </p>
        </section>
      </>
    </div>
  );
}
