import { requireAuthNode, readJsonBody, sendJson } from "../../../src/lib/api/middleware.js";
import { db, invitation, userRole, worker } from "../../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  const url = new URL(req.url!, "http://localhost");
  const id = url.pathname.split("/").pop();

  if (!id) return send(400, { error: "Invitation ID is required" });

  try {
    if (req.method === "PATCH") {
      const authUser = await requireAuthNode(req);
      const body = await readJsonBody(req);
      const { accept, displayName, avatar } = body as { accept?: boolean; displayName?: string; avatar?: string };

      const inv = await db.query.invitation.findFirst({ where: eq(invitation.id, id) });

      if (!inv) return send(404, { error: "Invitation not found" });
      if (new Date(inv.expiresAt) < new Date()) return send(403, { error: "Invitation expired" });
      if (inv.usedAt) return send(403, { error: "Invitation already used" });

      if (accept) {
        const nowIso = new Date().toISOString();
        const roleId = randomUUID();

        await db.insert(userRole).values({
          id: roleId,
          userId: authUser.userId,
          role: inv.role,
          displayName: displayName ?? authUser.name ?? null,
          avatar: avatar ?? null,
          active: true,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        if (inv.role === "worker") {
          await db.insert(worker).values({
            id: randomUUID(),
            userRoleId: roleId,
            jobTitle: null,
            dailyKmTarget: 60,
            active: true,
            isDemo: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }

        await db.update(invitation).set({ usedAt: nowIso }).where(eq(invitation.id, id));
        return send(200, { message: "Invitation accepted" });
      }

      return send(400, { error: "Invalid action" });
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    return send(500, { error: message });
  }
}
