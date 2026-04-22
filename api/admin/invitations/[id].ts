import { db, invitation, userRole, worker } from "../../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth, badRequest, forbidden, serverError } from "../../../src/lib/api/middleware.js";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Invitation ID is required");
  }

  try {
    if (req.method === "PATCH") {
      const authUser = await requireAuth(req);
      const body = await req.json();
      const { accept, displayName, avatar } = body;

      const inv = await db.query.invitation.findFirst({
        where: eq(invitation.id, id),
      });

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (new Date(inv.expiresAt) < new Date()) {
        return forbidden("Invitation expired");
      }

      if (inv.usedAt) {
        return forbidden("Invitation already used");
      }

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

        return new Response(JSON.stringify({ message: "Invitation accepted" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return badRequest("Invalid action");
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return serverError(message);
  }
}
