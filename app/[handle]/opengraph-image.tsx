import { ImageResponse } from "next/og";
import { fetchSite, safeImg } from "@/lib/site";
import { resolveTheme } from "@/lib/themes";

/**
 * Social preview card (WhatsApp/LinkedIn/X/Slack/Discord) — dark premium card with
 * the profile photo, name, role, top skills and the page URL.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portfolio on privatecareerjob";

export default async function OgImage({ params }: { params: Promise<{ handle: string }> }) {
  const raw = decodeURIComponent((await params).handle);
  const handle = raw.startsWith("@") ? raw.slice(1).toLowerCase() : null;
  const site = handle ? await fetchSite(handle) : null;

  if (!site) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#14161D", color: "#F2F4F8", fontSize: 56, fontWeight: 800 }}>
          privatecareerjob
        </div>
      ),
      size
    );
  }

  const t = resolveTheme(site);
  const photo = safeImg(site.photoUri);
  const initials = (site.name || site.handle)
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const skills = (site.skills ?? []).slice(0, 4);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#14161D", color: "#F2F4F8", padding: 72, position: "relative" }}>
        {/* accent bar + glow */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: t.accent, display: "flex" }} />
        <div style={{ position: "absolute", right: -140, top: -140, width: 460, height: 460, borderRadius: 460, background: t.accent, opacity: 0.14, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 44, marginTop: 24 }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={190} height={190} style={{ borderRadius: 190, border: `6px solid ${t.accent}` }} alt="" />
          ) : (
            <div style={{ width: 190, height: 190, borderRadius: 190, border: `6px solid ${t.accent}`, background: "#1B1F2A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 800 }}>
              {initials}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1.5, display: "flex" }}>{site.name || "@" + site.handle}</div>
            {site.headline && <div style={{ fontSize: 32, color: "#A6ADBB", marginTop: 8, display: "flex" }}>{site.headline}</div>}
            {site.location && <div style={{ fontSize: 24, color: "#6F7787", marginTop: 10, display: "flex" }}>📍 {site.location}</div>}
          </div>
        </div>

        {skills.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 52 }}>
            {skills.map((s) => (
              <div key={s} style={{ display: "flex", padding: "12px 26px", borderRadius: 999, background: "#1B1F2A", border: "1px solid #2A3040", fontSize: 24, fontWeight: 600, color: "#F2F4F8" }}>
                {s}
              </div>
            ))}
          </div>
        )}

        <div style={{ position: "absolute", bottom: 56, left: 72, right: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#A6ADBB", display: "flex" }}>privatecareerjob.com/@{site.handle}</div>
          <div style={{ display: "flex", padding: "14px 30px", borderRadius: 999, background: t.accent, color: "#FFFFFF", fontSize: 24, fontWeight: 700 }}>
            View portfolio
          </div>
        </div>
      </div>
    ),
    size
  );
}
