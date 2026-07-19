import { verifyRequest } from "./serverAuth";
import { rateLimit, RATE_LIMITED_MESSAGE } from "./rateLimit";

/**
 * Shared route-handler factory for the AI tools: auth gate → body parse →
 * tool handler → error mapping. Every tool route is `export const POST =
 * aiRoute(handler)` so the behaviour stays identical across tools.
 */

/** True for errors that mean "Vertex AI isn't set up on this deployment yet". */
function isSetupError(message: string): boolean {
  return /default credentials|GOOGLE_APPLICATION_CREDENTIALS|GOOGLE_CLOUD_PROJECT|PERMISSION_DENIED|has not been used|is disabled|UNAUTHENTICATED|Could not refresh access token|metadata/i.test(
    message
  );
}

export const AI_NOT_CONFIGURED =
  "AI tools are not switched on for this deployment yet. Vertex AI access is being set up — check back soon.";

export function aiRoute<In>(handler: (body: In, uid: string) => Promise<unknown>) {
  return async function POST(req: Request): Promise<Response> {
    const uid = await verifyRequest(req);
    if (!uid) return Response.json({ error: "Please sign in to use AI tools." }, { status: 401 });

    // 20 AI calls/min and 150/hour per user — generous for real use, hostile to loops
    if (!rateLimit(`ai-m:${uid}`, 20, 60_000) || !rateLimit(`ai-h:${uid}`, 150, 3_600_000)) {
      return Response.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }

    let body: In;
    try {
      body = (await req.json()) as In;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    try {
      const result = await handler(body, uid);
      return Response.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (isSetupError(message)) return Response.json({ error: AI_NOT_CONFIGURED, setup: true }, { status: 503 });
      console.error("[ai]", message);
      return Response.json({ error: "The AI service hit a problem. Please try again." }, { status: 502 });
    }
  };
}

/** Clamp free-text inputs so a pasted novel can't blow up the prompt. */
export function clampText(value: unknown, max = 12000): string {
  return typeof value === "string" ? value.slice(0, max).trim() : "";
}
