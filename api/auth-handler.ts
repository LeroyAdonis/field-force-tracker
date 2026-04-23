import { auth } from "../src/lib/auth.js";

export default async function handler(req: Request): Promise<Response> {
  const t0 = Date.now();

  try {
    const base =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

    // req.url on Vercel is a relative path — always resolve against base
    const rewrittenUrl = new URL(req.url, base);
    const label = `[auth-handler] ${req.method} ${rewrittenUrl.pathname}`;
    console.log(`${label} — start`);

    const pathSegment = rewrittenUrl.searchParams.get("__path") ?? "";
    const authPath = pathSegment ? `/api/auth/${pathSegment}` : "/api/auth";
    const authUrl = new URL(authPath, base);

    // Copy through any real query params, dropping Vercel-injected routing params
    rewrittenUrl.searchParams.forEach((value, key) => {
      if (key !== "__path" && key !== "path") authUrl.searchParams.set(key, value);
    });

    console.log(`${label} — reconstructed URL: ${authUrl.href} (+${Date.now() - t0}ms)`);

    // Vercel's Request body stream doesn't survive new Request(url, req) correctly —
    // read the raw body text first and re-attach it explicitly.
    const bodyText = req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : null;

    const authReq = new Request(authUrl.href, {
      method: req.method,
      headers: req.headers,
      body: bodyText,
    });

    const response = await auth.handler(authReq);

    console.log(`${label} — auth.handler returned ${response.status} (+${Date.now() - t0}ms)`);
    return response;
  } catch (error) {
    console.error(`[auth-handler] error after ${Date.now() - t0}ms:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
