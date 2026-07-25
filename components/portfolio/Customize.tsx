"use client";

import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";
import type { PublicSite } from "@/lib/site";
import { ACCENTS, DESIGNS, LEGACY_TEMPLATE_OF, WEB_FONTS, resolveTheme } from "@/lib/themes";

/**
 * On-page design editor, shown only to the page's owner (Firebase Google sign-in,
 * auth.uid must match the doc's uid — the same check Firestore rules enforce on
 * write). Changes preview live via onChange; Save persists to publicProfiles/{handle}.
 */
export function Customize({ site, onChange }: { site: PublicSite; onChange: (s: PublicSite) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const isOwner = !!user && user.uid === site.uid;

  const signIn = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      if (cred.user.uid !== site.uid) setNote("This page belongs to a different account.");
      else setOpen(true);
    } catch {
      setNote("Sign-in was cancelled.");
    }
  };

  const t = resolveTheme(site);
  const design = t.design;
  const fontId = site.design?.font ?? "system";

  const apply = (partial: Partial<PublicSite>) => onChange({ ...site, ...partial });

  const setDesign = (id: string) => {
    const d = DESIGNS.find((x) => x.id === id)!;
    apply({ design: { id: d.id, accent: d.accent, font: fontId, fontFamily: site.design?.fontFamily ?? "Manrope" }, template: LEGACY_TEMPLATE_OF[d.id] });
  };
  const setAccent = (hex: string) => apply({ design: { id: design.id, accent: hex, font: fontId, fontFamily: site.design?.fontFamily ?? "Manrope" } });
  const setFont = (id: string) => {
    const f = WEB_FONTS.find((x) => x.id === id)!;
    apply({ design: { id: design.id, accent: t.accent, font: f.id, fontFamily: f.family } });
  };

  const save = async () => {
    if (!isOwner) return;
    setBusy(true);
    setNote("");
    try {
      await updateDoc(doc(db, "publicProfiles", site.handle), {
        design: { id: design.id, accent: t.accent, font: fontId, fontFamily: t.fontFamily },
        template: LEGACY_TEMPLATE_OF[design.id],
        email: site.showEmail ? site.email ?? user?.email ?? "" : "",
        showEmail: !!site.showEmail,
        phone: site.showPhone ? site.phone ?? "" : "",
        showPhone: !!site.showPhone && !!site.phone,
        discoverable: !!site.discoverable,
        noindex: !site.discoverable,
        updatedAt: serverTimestamp(),
      });
      setNote("Saved ✓ — live in about a minute.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save — try again.");
    } finally {
      setBusy(false);
    }
  };

  const panelBg = t.dark ? "bg-[#1B1F2A] border-[#2A3040] text-[#F2F4F8]" : "bg-white border-[#ECECF2] text-[#16181D]";
  const softText = t.dark ? "text-[#A6ADBB]" : "text-[#5D6470]";

  return (
    <>
      {/* floating entry point */}
      <div className="fixed bottom-20 sm:bottom-5 right-4 z-40">
        {!open && (
          <button
            onClick={() => (isOwner ? setOpen(true) : signIn())}
            className={`inline-flex items-center gap-2 min-h-11 px-4 rounded-full border text-[13.5px] font-bold shadow-lg cursor-pointer ${panelBg}`}
            aria-label="Customize this page"
          >
            ✎ {isOwner ? "Customize" : "My page?"}
          </button>
        )}
      </div>
      {note && !open && (
        <p className={`fixed bottom-32 sm:bottom-16 right-4 z-40 text-[12.5px] px-3 py-1.5 rounded-full border shadow ${panelBg}`}>{note}</p>
      )}

      {/* editor panel */}
      {open && isOwner && (
        <aside className={`fixed z-50 inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[360px] sm:rounded-3xl rounded-t-3xl border shadow-2xl max-h-[80vh] overflow-y-auto ${panelBg}`} aria-label="Customize panel">
          <div className={`sticky top-0 flex items-center justify-between px-5 py-3.5 border-b ${t.dark ? "border-[#2A3040] bg-[#1B1F2A]" : "border-[#ECECF2] bg-white"}`}>
            <b className="text-[15px]">Customize</b>
            <button onClick={() => setOpen(false)} aria-label="Close" className="min-w-9 min-h-9 rounded-full cursor-pointer hover:opacity-70 text-[18px]">✕</button>
          </div>

          <div className="p-5 space-y-5">
            {/* design */}
            <div>
              <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${softText}`}>Design</p>
              <div className="grid grid-cols-2 gap-2">
                {DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDesign(d.id)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-[13px] font-semibold cursor-pointer ${
                      d.id === design.id ? "border-[var(--pa)] bg-[var(--pa-soft)]" : t.dark ? "border-[#2A3040]" : "border-[#ECECF2]"
                    }`}
                  >
                    <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: d.accent }} />
                    {d.name}
                    <span className={`block text-[11px] font-medium ${softText}`}>{d.field}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* accent */}
            <div>
              <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${softText}`}>Accent</p>
              <div className="flex flex-wrap gap-2.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.hex)}
                    aria-label={`Accent ${a.name}`}
                    className={`w-9 h-9 rounded-full cursor-pointer ${a.hex === t.accent ? "ring-2 ring-offset-2 ring-[var(--pa)]" : ""}`}
                    style={{ background: a.hex }}
                  />
                ))}
              </div>
            </div>

            {/* font */}
            <div>
              <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${softText}`}>Font</p>
              <select
                value={fontId}
                onChange={(e) => setFont(e.target.value)}
                className={`w-full min-h-11 px-3 rounded-xl border text-[14px] font-semibold ${t.dark ? "bg-[#14161D] border-[#2A3040]" : "bg-white border-[#ECECF2]"}`}
              >
                {WEB_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.family}
                    {f.serif ? " (serif)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* visibility */}
            <div className="space-y-3">
              <p className={`text-[12px] font-bold uppercase tracking-wider ${softText}`}>Visibility</p>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[14px] font-semibold">Show email<br /><span className={`text-[12px] font-medium ${softText}`}>{site.email || user?.email}</span></span>
                <input
                  type="checkbox"
                  checked={!!site.showEmail}
                  onChange={(e) => apply({ showEmail: e.target.checked, email: e.target.checked ? site.email || user?.email || "" : "" })}
                  className="w-5 h-5 accent-[var(--pa)]"
                />
              </label>
              <label className={`flex items-center justify-between gap-3 ${site.phone ? "cursor-pointer" : "opacity-50"}`}>
                <span className="text-[14px] font-semibold">Show phone<br /><span className={`text-[12px] font-medium ${softText}`}>{site.phone || "Add a phone from the app first"}</span></span>
                <input
                  type="checkbox"
                  disabled={!site.phone && !site.showPhone}
                  checked={!!site.showPhone && !!site.phone}
                  onChange={(e) => apply({ showPhone: e.target.checked })}
                  className="w-5 h-5 accent-[var(--pa)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[14px] font-semibold">Show in search engines<br /><span className={`text-[12px] font-medium ${softText}`}>Off = only people with the link find you</span></span>
                <input
                  type="checkbox"
                  checked={!!site.discoverable}
                  onChange={(e) => apply({ discoverable: e.target.checked, noindex: !e.target.checked })}
                  className="w-5 h-5 accent-[var(--pa)]"
                />
              </label>
            </div>

            <button
              onClick={save}
              disabled={busy}
              className="w-full min-h-12 rounded-full text-[15px] font-bold text-white cursor-pointer disabled:opacity-60"
              style={{ background: "#F59E0B", color: "#111827" }}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
            {note && <p className={`text-[12.5px] text-center ${softText}`}>{note}</p>}
            <p className={`text-[11.5px] text-center ${softText}`}>Content (skills, experience, projects) is edited in the privatecareerjob app.</p>
          </div>
        </aside>
      )}
    </>
  );
}
