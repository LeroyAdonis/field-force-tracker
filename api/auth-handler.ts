import { auth } from "../src/lib/auth.js";

export default async function handler(req: Request): Promise<Response> {
  const t0 = Date.now();
  const label = `[auth-handler] ${req.method} ${new URL(req.url).pathname}`;
  console.log(`${label} — start`);

  try {
    const base =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

    const rewrittenUrl = new URL(req.url, base);
    const pathSegment = rewrittenUrl.searchParams.get("__path") ?? "";

    const authPath = pathSegment ? `/api/auth/${pathSegment}` : "/api/auth";
    const authUrl = new URL(authPath, base);

    rewrittenUrl.searchParams.forEach((value, key) => {
      if (key !== "__path") authUrl.searchParams.set(key, value);
    });

    console.log(`${label} — reconstructed URL: ${authUrl.href} (+${Date.now() - t0}ms)`);

    const response = await auth.handler(new Request(authUrl.href, req));

    console.log(`${label} — auth.handler returned ${response.status} (+${Date.now() - t0}ms)`);
    return response;
  } catch (error) {
    console.error(`${label} — error after ${Date.now() - t0}ms:`, error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
