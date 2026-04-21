// Required imports for database models and utilities
import { db, invitation, userRole } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { badRequest, forbidden, serverError } from "../../src/lib/api/middleware.js";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Invitation ID is required");
  }

  try {
    if (req.method === "PATCH") {
      const body = await req.json();
      const { accept } = body;

      // Fetch the invitation
      const inv = await db.query.invitation.findFirst({
        where: eq(invitation.id, id),
      });

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if invitation has expired
      if (new Date(inv.expiresAt) < new Date()) {
        return forbidden("Invitation expired");
      }

      if (accept) {
        const userRoleRecord = await db.insert(userRole).values({
          userId: inv.userId,
          role: inv.role,
          displayName: inv.displayName,
          avatar: inv.avatar ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Mark invitation as used
        await db
          .update(invitation)
          .set({ usedAt: new Date().toISOString() })
          .where(eq(invitation.id, id));

        return new Response(
          JSON.stringify({
            message: "Invitation accepted",
            userRole: userRoleRecord,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return serverError(message);
  }
}