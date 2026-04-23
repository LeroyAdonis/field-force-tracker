import { requireRoleNode, readJsonBody, sendJson } from "../../../src/lib/api/middleware.js";
import { db, invitation } from "../../../src/lib/db/index.js";
import { randomUUID } from "crypto";
import { desc } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  try {
    if (req.method === "GET") {
      await requireRoleNode(req, ["admin"]);
      const invitations = await db.select().from(invitation).orderBy(desc(invitation.createdAt));
      return send(200, invitations);
    }

    if (req.method === "POST") {
      const admin = await requireRoleNode(req, ["admin"]);
      const body = await readJsonBody(req);
      const { email, role } = body as { email?: string; role?: string };

      if (!email || !role) return send(400, { error: "email and role are required" });
      if (!["admin", "worker"].includes(role)) return send(400, { error: "role must be 'admin' or 'worker'" });

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

      return send(201, { id, email, role, token, expiresAt });
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    if (message === "Forbidden") return send(403, { error: "Forbidden" });
    return send(500, { error: message });
  }
}
