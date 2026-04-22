import { auth } from "../../src/lib/auth.js";

export default async function handler(req: Request): Promise<Response> {
  try {
    return await auth.handler(req);
  } catch (error) {
    console.error("Auth handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
