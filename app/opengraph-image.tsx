import { ImageResponse } from "next/og";

/** Sitewide default OG card (1200×630) — branded violet gradient with the
 *  wordmark and tagline. Pages without their own og image inherit this. */

export const runtime = "edge";
export const alt = "privatecareerjob — India's premium job platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #1B1740 0%, #2A2260 55%, #5B4BFF 130%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#5B4BFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            p
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>privatecareerjob</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.15, marginTop: 48, maxWidth: 980 }}>
          India&apos;s premium job platform
        </div>
        <div style={{ fontSize: 30, marginTop: 28, opacity: 0.85, maxWidth: 940, lineHeight: 1.4 }}>
          Verified jobs · Live application tracking · Free AI resume tools — for job seekers and recruiters.
        </div>
      </div>
    ),
    size
  );
}
