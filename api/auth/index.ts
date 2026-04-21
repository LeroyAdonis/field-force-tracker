import { auth } from "../../src/lib/auth.js";

export default async function handler(req: Request) {
  try {
    const response = await auth.handler(req);
    return response;
  } catch (error) {
    console.error("Auth handler error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
