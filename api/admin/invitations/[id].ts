import { requireAuth, badRequest, serverError } from "../../../src/lib/api/middleware";
import { db, invitation, user, userRole, worker } from "../../../src/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Invitation ID is required");
  }

  try {
    if (req.method === "PATCH") {
      const authUser = await requireAuth(req);

      const inv = await db.query.invitation.findFirst({
        where: eq(invitation.id, id),
      });

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (inv.usedAt) {
        return new Response(JSON.stringify({ error: "Invitation already used" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (new Date(inv.expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: "Invitation expired" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Only allow the user with matching email to accept
      if (authUser.email !== inv.email) {
        return new Response(JSON.stringify({ error: "Email does not match invitation" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Mark invitation as used
      await db
        .update(invitation)
        .set({ usedAt: new Date() })
        .where(eq(invitation.id, id));

      // Get or create user role for the newly signed up user
      let userRoleRecord = await db.query.userRole.findFirst({
        where: eq(userRole.userId, authUser.id),
      });

      if (!userRoleRecord) {
        // Create user role based on invitation
        const userRoleId = uuid();
        await db.insert(userRole).values({
          id: userRoleId,
          userId: authUser.id,
          role: inv.role,
          displayName: authUser.name,
          avatar: authUser.image,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        userRoleRecord = {
          id: userRoleId,
          userId: authUser.id,
          role: inv.role,
          displayName: authUser.name,
          avatar: authUser.image,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      // If role is worker, create worker record
      if (inv.role === "worker" && !userRoleRecord.worker) {
        const workerId = uuid();
        await db.insert(worker).values({
          id: workerId,
          userRoleId: userRoleRecord.id,
          jobTitle: "",
          dailyKmTarget: 120,
          active: true,
          isDemo: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const response = {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        usedAt: new Date(),
        message: "Invitation accepted successfully",
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
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
