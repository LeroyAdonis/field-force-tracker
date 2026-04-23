import { auth } from "../src/lib/auth.js";

// Vercel's request adapter pre-parses the body in some runtimes.
// Read body in a way that handles all cases:
//   1. Standard Fetch API (text/json methods)
//   2. Pre-parsed body object (Vercel Node.js shim stores parsed JSON in req.body)
//   3. Raw Node.js stream (async iterable of Buffers)
async function readBodyAsText(req: Request): Promise<string | null> {
  if (req.method === "GET" || req.method === "HEAD") return null;

  // Case 1: Standard Fetch API Request
  if (typeof (req as any).text === "function") {
    return await (req as any).text();
  }

  const r = req as any;

  // Case 2: Pre-parsed body (Vercel Node.js shim)
  if (r.body !== undefined && r.body !== null && typeof r.body !== "object") {
    return String(r.body);
  }
  if (r.body !== null && r.body !== undefined && typeof r.body === "object" && !r.body.read && !r.body.getReader) {
    return JSON.stringify(r.body);
  }

  // Case 3: ReadableStream (Web API body)
  if (r.body && typeof r.body.getReader === "function") {
    const reader = r.body.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const merged = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.length; }
    return new TextDecoder().decode(merged);
  }

  // Case 4: Node.js async-iterable stream (IncomingMessage)
  if (r.body && typeof r.body[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of r.body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
  }

  // Case 5: req itself is an async-iterable stream (IncomingMessage passed directly)
  if (typeof r[Symbol.asyncIterator] === "function") {
    const chunks: Buffer[] = [];
    for await (const chunk of r) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf-8");
  }

  return null;
}

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

    const bodyText = await readBodyAsText(req);
    console.log(`${label} — bodyText type: ${typeof bodyText}, length: ${bodyText?.length ?? "null"} (+${Date.now() - t0}ms)`);

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
