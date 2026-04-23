import { auth } from "../src/lib/auth.js";

export default async function handler(req: Request): Promise<Response> {
  try {
    const base =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

    const rewrittenUrl = new URL(req.url, base);
    const pathSegment = rewrittenUrl.searchParams.get("__path") ?? "";

    // Reconstruct the original /api/auth/* URL that better-auth expects
    const authPath = pathSegment ? `/api/auth/${pathSegment}` : "/api/auth";
    const authUrl = new URL(authPath, base);

    // Preserve any query params from the original request (excluding __path)
    rewrittenUrl.searchParams.forEach((value, key) => {
      if (key !== "__path") authUrl.searchParams.set(key, value);
    });

    return await auth.handler(new Request(authUrl.href, req));
  } catch (error) {
    console.error("Auth handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
