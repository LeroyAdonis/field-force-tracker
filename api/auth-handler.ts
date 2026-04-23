import { auth } from "../src/lib/auth.js";
import { toNodeHandler } from "better-auth/node";
import type { IncomingMessage, ServerResponse } from "http";

// better-auth/node's toNodeHandler:
//   - converts IncomingMessage → Web Request (handles raw stream AND pre-parsed body)
//   - converts Web Response → Node HTTP response (uses splitCookiesString to correctly
//     set multiple Set-Cookie headers that Vercel would otherwise merge/drop)
const nodeHandler = toNodeHandler(auth);

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
): Promise<void> {
  // Vercel rewrite maps /api/auth/* → /api/auth-handler?__path=*
  // Restore the original path so better-auth can route it.
  const urlStr = req.url ?? "/";
  const qIdx = urlStr.indexOf("?");
  const qs = qIdx >= 0 ? urlStr.slice(qIdx + 1) : "";
  const params = new URLSearchParams(qs);
  const pathSegment = params.get("__path");

  if (pathSegment !== null) {
    params.delete("__path");
    params.delete("path");
    const remaining = params.toString();
    req.url = remaining
      ? `/api/auth/${pathSegment}?${remaining}`
      : `/api/auth/${pathSegment}`;
  } else {
    req.url = "/api/auth";
  }

  return nodeHandler(req as Parameters<typeof nodeHandler>[0], res);
}
