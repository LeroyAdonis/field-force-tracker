import { auth } from "../auth.js";
import { db, userRole } from "../db/index.js";
import { eq } from "drizzle-orm";

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

  // Get user role and metadata
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