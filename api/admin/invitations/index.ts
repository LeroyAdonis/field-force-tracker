import { requireRole, badRequest, serverError } from "../../../src/lib/api/middleware.js";
import { db, invitation } from "../../../src/lib/db/index.js";
import { randomUUID } from "crypto";
import { desc } from "drizzle-orm";

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method === "GET") {
      await requireRole(req, ["admin"]);
      const invitations = await db.select().from(invitation).orderBy(desc(invitation.createdAt));
      return new Response(JSON.stringify(invitations), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "POST") {
      const admin = await requireRole(req, ["admin"]);
      const body = await req.json();
      const { email, role } = body;

      if (!email || !role) return badRequest("email and role are required");
      if (!["admin", "worker"].includes(role)) return badRequest("role must be 'admin' or 'worker'");

      const token = randomUUID();
      const nowIso = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const id = randomUUID();

      await db.insert(invitation).values({
        id,
        email,
        role,
        createdBy: admin.userId,
        token,
        expiresAt,
        createdAt: nowIso,
      });

      return new Response(
        JSON.stringify({ id, email, role, token, expiresAt }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized")
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    if (message === "Forbidden")
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    return serverError(message);
  }
}
