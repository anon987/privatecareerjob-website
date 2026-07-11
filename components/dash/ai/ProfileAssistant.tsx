"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { card } from "../bits";
import { profileToText } from "./bits";
import { AiError, callAiTool } from "@/lib/ai/client";
import type { AppProfile } from "@/lib/account";
import type { ProfileAssistantResult } from "@/app/api/ai/profile-assistant/route";

/**
 * AI profile-completion coach. Runs off the SAVED profile, caches results in
 * localStorage, and re-generates on its own when the profile changes or the
 * tips are older than 3 days — the "time to time" nudge without spamming the
 * model on every visit.
 */

const CACHE_PREFIX = "psj-profile-coach:";
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

interface CacheShape {
  profileHash: string;
  at: number;
  result: ProfileAssistantResult;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
}

/** Read-only peek at the cached tips — used by the Home nudge card. */
export function readProfileCoachTip(uid: string): string | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${uid}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CacheShape;
    return cached.result?.tips?.[0] ? `${cached.result.tips[0].section}: ${cached.result.tips[0].action}` : null;
  } catch {
    return null;
  }
}

export default function ProfileAssistant({
  uid,
  profile,
  completenessPct,
  missing,
  onApplyHeadline,
  onApplySummary,
  onAddSkill,
}: {
  uid: string;
  profile: AppProfile;
  completenessPct: number;
  missing: string[];
  onApplyHeadline: (v: string) => void;
  onApplySummary: (v: string) => void;
  onAddSkill: (v: string) => void;
}) {
  const [result, setResult] = useState<ProfileAssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AiError | null>(null);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const inFlight = useRef(false);

  const profileText = profileToText(profile);
  const profileHash = hash(profileText + completenessPct);
  const cacheKey = `${CACHE_PREFIX}${uid}`;

  const generate = async (force = false) => {
    if (inFlight.current) return;

    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as CacheShape;
          const fresh = cached.profileHash === profileHash && Date.now() - cached.at < STALE_AFTER_MS;
          if (fresh) {
            setResult(cached.result);
            return;
          }
        }
      } catch {}
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await callAiTool<ProfileAssistantResult>("profile-assistant", {
        profile: profileText,
        completenessPct,
        missing,
      });
      setResult(res);
      setApplied({});
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ profileHash, at: Date.now(), result: res } satisfies CacheShape));
      } catch {}
    } catch (e) {
      setError(e instanceof AiError ? e : new AiError("Could not load suggestions right now."));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  // Auto-run on mount and whenever the saved profile changes.
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileHash]);

  const markApplied = (key: string) => setApplied((a) => ({ ...a, [key]: true }));

  return (
    <section className={`${card} rise-1 border-brand/25 bg-[linear-gradient(135deg,rgba(91,75,255,0.05),transparent_60%)]`} aria-label="AI profile coach">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className="grid place-items-center w-9 h-9 rounded-xl bg-brand text-white shrink-0"><Sparkles className="h-4.5 w-4.5" /></span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-extrabold">AI profile coach</h2>
          <p className="text-[12px] text-ink-3">Personal suggestions to get you to 100% — refreshed when your profile changes.</p>
        </div>
        <button
          type="button"
          onClick={() => generate(true)}
          disabled={loading}
          aria-label="Refresh suggestions"
          className="grid place-items-center w-9 h-9 rounded-xl border border-line text-ink-2 hover:text-brand hover:border-brand/40 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {loading && !result && <p className="text-[13px] text-ink-2 mt-3">Reading your profile…</p>}

      {error && (
        <p className={`text-[12.5px] mt-3 font-medium ${error.setup ? "text-amber-700" : "text-ink-3"}`}>
          {error.setup ? `⏳ ${error.message}` : error.message}
        </p>
      )}

      {result && (
        <div className="mt-3 grid gap-3">
          <p className="text-[13.5px] leading-relaxed font-semibold">{result.assessment}</p>

          {result.tips.length > 0 && (
            <ol className="grid gap-2">
              {result.tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-2xl bg-white/70 border border-line px-3.5 py-3">
                  <span aria-hidden className="grid place-items-center w-5 h-5 rounded-full bg-brand-tonal text-brand text-[11px] font-extrabold shrink-0 mt-0.5">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-relaxed"><span className="font-extrabold">{t.section}:</span> {t.action}</p>
                    {t.example && <p className="text-[12px] text-ink-3 mt-1 leading-relaxed italic">e.g. “{t.example}”</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {result.headlineDraft && (
            <div className="rounded-2xl bg-white/70 border border-line px-3.5 py-3">
              <p className="text-[11.5px] font-extrabold text-ink-3 uppercase tracking-wide">Suggested headline</p>
              <p className="text-[13.5px] font-semibold mt-1">{result.headlineDraft}</p>
              <button
                type="button"
                disabled={applied.headline}
                onClick={() => { onApplyHeadline(result.headlineDraft); markApplied("headline"); }}
                className="mt-2 text-[12.5px] font-extrabold text-brand cursor-pointer disabled:text-green-700"
              >
                {applied.headline ? "Applied ✓ — remember to save" : "Use this headline"}
              </button>
            </div>
          )}

          {result.summaryDraft && (
            <div className="rounded-2xl bg-white/70 border border-line px-3.5 py-3">
              <p className="text-[11.5px] font-extrabold text-ink-3 uppercase tracking-wide">Suggested summary</p>
              <p className="text-[13px] leading-relaxed mt-1">{result.summaryDraft}</p>
              <button
                type="button"
                disabled={applied.summary}
                onClick={() => { onApplySummary(result.summaryDraft); markApplied("summary"); }}
                className="mt-2 text-[12.5px] font-extrabold text-brand cursor-pointer disabled:text-green-700"
              >
                {applied.summary ? "Applied ✓ — remember to save" : "Use this summary"}
              </button>
            </div>
          )}

          {result.skillSuggestions.length > 0 && (
            <div className="rounded-2xl bg-white/70 border border-line px-3.5 py-3">
              <p className="text-[11.5px] font-extrabold text-ink-3 uppercase tracking-wide">Skills you could add</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.skillSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={applied[`skill:${s}`]}
                    onClick={() => { onAddSkill(s); markApplied(`skill:${s}`); }}
                    className="px-2.5 py-1 rounded-full border text-[11.5px] font-bold transition cursor-pointer border-brand/30 text-brand hover:bg-brand-tonal disabled:border-green-200 disabled:text-green-700 disabled:bg-green-50"
                  >
                    {applied[`skill:${s}`] ? `✓ ${s}` : `+ ${s}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
