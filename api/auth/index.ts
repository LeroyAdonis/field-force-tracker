import { auth } from "../../src/lib/auth.js";

export default async function handler(req: Request): Promise<Response> {
  try {
    const base =
      process.env.BETTER_AUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");
    const url = new URL(req.url, base);
    const normalizedReq = url.href === req.url ? req : new Request(url.href, req);
    return await auth.handler(normalizedReq);
  } catch (error) {
    console.error("Auth handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
