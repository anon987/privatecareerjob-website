import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { verifyRequest } from "@/lib/ai/serverAuth";

/**
 * Renders the resume paper (the builder's print markup) to a real,
 * selectable-text A4 PDF with headless Chromium — no print dialog.
 */

export const maxDuration = 60;

const BASE = 360; // natural paper width in the builder (see ResumeBuilder BASE)
const PRINTABLE_MM = 190; // A4 width 210mm minus 10mm margins each side
const ZOOM = (PRINTABLE_MM / 25.4) * 96 / BASE;

interface Input {
  html: string;
  font?: string;
  title?: string;
}

export async function POST(req: Request): Promise<Response> {
  const uid = await verifyRequest(req);
  if (!uid) return Response.json({ error: "Please sign in to download your resume." }, { status: 401 });

  let body: Input;
  try {
    body = (await req.json()) as Input;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const html = typeof body.html === "string" ? body.html.slice(0, 900_000) : "";
  if (!html.trim()) return Response.json({ error: "Nothing to render." }, { status: 400 });
  const font = typeof body.font === "string" ? body.font.slice(0, 60).replace(/[^\w\s-]/g, "") : "";
  const title = (typeof body.title === "string" ? body.title : "Resume").replace(/[^\w\s.-]/g, "").trim().slice(0, 80) || "Resume";

  const fontLink = font
    ? `<link href="https://fonts.googleapis.com/css2?family=${font.replace(/ /g, "+")}:wght@400;600;700&display=swap" rel="stylesheet">`
    : "";
  const doc =
    `<!doctype html><html><head><meta charset="utf-8">${fontLink}` +
    `<style>html,body{margin:0;padding:0;background:#fff;}` +
    `#wrap{width:${BASE}px;zoom:${ZOOM.toFixed(4)};}` +
    `#wrap>*{border:none!important;border-radius:0!important;box-shadow:none!important;}` +
    `*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head>` +
    `<body><div id="wrap">${html}</div></body></html>`;

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    // The HTML is user-supplied — lock the page down so it can't be used for
    // SSRF or resource abuse: no page scripts, and network access limited to
    // Google Fonts (everything else in the resume is inline/data: URIs).
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (r) => {
      const u = r.url();
      const ok =
        u.startsWith("data:") ||
        u.startsWith("about:") ||
        u.startsWith("https://fonts.googleapis.com/") ||
        u.startsWith("https://fonts.gstatic.com/");
      if (ok) r.continue().catch(() => {});
      else r.abort().catch(() => {});
    });
    await page.setContent(doc, { waitUntil: "load", timeout: 30_000 });
    // Web fonts finish loading after `load`; wait so text renders in the chosen font.
    await page.evaluate(() => (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title} - Resume.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[resume-pdf]", e instanceof Error ? e.message : e);
    return Response.json({ error: "Could not generate the PDF." }, { status: 502 });
  } finally {
    await browser?.close().catch(() => {});
  }
}
