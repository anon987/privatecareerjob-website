import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium binary for the resume PDF route must stay unbundled.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  // The brotli-packed Chromium binaries are loaded via fs at runtime, which
  // file tracing can't see — include them explicitly or the deployed
  // function fails with "input directory …/bin does not exist".
  outputFileTracingIncludes: {
    "/api/resume-pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
