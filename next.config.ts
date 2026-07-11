import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Chromium binary for the resume PDF route must stay unbundled.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
