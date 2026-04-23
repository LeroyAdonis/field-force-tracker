import { auth } from "../auth.js";
import { db, userRole } from "../db/index.js";
import { eq } from "drizzle-orm";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingMessage, ServerResponse } from "http";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  displayName: string | null;
  avatar: string | null;
  active: boolean;
  userId: string;
  userRoleId: string;
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userRoleData = await db.query.userRole.findFirst({
    where: eq(userRole.userId, session.user.id),
    with: {
      user: true,
    },
  });

  if (!userRoleData) {
    throw new Error("User role not found");
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name,
    image: session.user.image,
    role: userRoleData.role,
    displayName: userRoleData.displayName,
    avatar: userRoleData.avatar,
    active: userRoleData.active,
    userId: session.user.id,
    userRoleId: userRoleData.id,
  };
}

export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }

  return user;
}

// Node.js handler helpers — use these in all api/*.ts functions

export async function requireAuthNode(req: IncomingMessage): Promise<AuthUser> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userRoleData = await db.query.userRole.findFirst({
    where: eq(userRole.userId, session.user.id),
    with: { user: true },
  });

  if (!userRoleData) {
    throw new Error("User role not found");
  }

  return {
    id: session.user.id,
    email: session.user.email || "",
    name: session.user.name,
    image: session.user.image,
    role: userRoleData.role,
    displayName: userRoleData.displayName,
    avatar: userRoleData.avatar,
    active: userRoleData.active,
    userId: session.user.id,
    userRoleId: userRoleData.id,
  };
}

export async function requireRoleNode(
  req: IncomingMessage,
  allowedRoles: string[]
): Promise<AuthUser> {
  const user = await requireAuthNode(req);
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

// Legacy Web API response helpers (still used by auth routes)

export function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function forbidden(message: string = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

export function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

export function serverError(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
