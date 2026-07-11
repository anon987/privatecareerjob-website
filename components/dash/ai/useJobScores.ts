"use client";

import { useEffect, useRef, useState } from "react";
import { callAiTool } from "@/lib/ai/client";
import { formatSalary, type JobDoc } from "@/lib/seeker";
import type { AppProfile } from "@/lib/account";
import { profileToText } from "./bits";
import type { JobScore, JobScoresResult } from "@/app/api/ai/job-scores/route";

/**
 * AI match scores for the jobs feed. Scores all live jobs against the
 * profile in one batched Gemini call, cached in sessionStorage per user +
 * profile version. Callers fall back to the local heuristic while loading
 * or when AI is unavailable — the feed never waits on this.
 */

const CACHE_PREFIX = "psj-ai-scores:";
const MAX_JOBS = 30;

interface CacheShape {
  profileHash: string;
  scores: Record<string, JobScore>;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h);
}

function readCache(key: string, profileHash: string): Record<string, JobScore> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheShape;
    return parsed.profileHash === profileHash ? parsed.scores : {};
  } catch {
    return {};
  }
}

export function useJobScores(uid: string, profile: AppProfile, jobs: JobDoc[]): Record<string, JobScore> {
  const [scores, setScores] = useState<Record<string, JobScore>>({});
  const inFlight = useRef(false);

  const profileText = profileToText(profile);
  const profileHash = hash(profileText);
  const cacheKey = `${CACHE_PREFIX}${uid}`;
  // Signature of which jobs still need scoring — effect reruns only when it changes.
  const jobIds = jobs.map((j) => j.id).sort().join(",");

  useEffect(() => {
    // Nothing to say without a real profile; heuristic fallback handles this.
    if (!profileText || profileText.length < 40 || !jobs.length || inFlight.current) return;

    const cached = readCache(cacheKey, profileHash);
    const missing = jobs.filter((j) => !cached[j.id]).slice(0, MAX_JOBS);
    if (!missing.length) {
      setScores(cached);
      return;
    }

    inFlight.current = true;
    setScores(cached);
    callAiTool<JobScoresResult>("job-scores", {
      profile: profileText,
      jobs: missing.map((j) => ({
        id: j.id,
        title: j.title,
        category: j.category,
        location: j.location,
        experienceLevel: j.experienceLevel,
        jobType: j.jobType,
        salary: formatSalary(j.salaryMin, j.salaryMax),
        description: j.description,
      })),
    })
      .then((res) => {
        const next = { ...cached };
        for (const s of res.scores) next[s.id] = s;
        setScores(next);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ profileHash, scores: next } satisfies CacheShape));
        } catch {}
      })
      .catch(() => {
        // AI unavailable (not configured, quota, offline) — cards keep the heuristic.
      })
      .finally(() => {
        inFlight.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, profileHash, jobIds]);

  return scores;
}
