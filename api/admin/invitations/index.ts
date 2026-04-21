import { requireAuth, requireRole, badRequest, serverError, forbidden } from "../../../src/lib/api/middleware";
import { db, invitation, userRole } from "../../../src/lib/db";
import { eq, isNull, gt } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      // Only admin can list invitations
      const user = await requireRole(req, ["admin"]);

      const invitations = await db.query.invitation.findMany({
        where: isNull(invitation.usedAt),
        with: {
          createdByUser: true,
        },
      });

      const response = invitations
        .filter((inv) => new Date(inv.expiresAt) > new Date())
        .map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          createdBy: inv.createdBy,
          createdByName: inv.createdByUser?.displayName,
          expiresAt: inv.expiresAt,
          usedAt: inv.usedAt,
          createdAt: inv.createdAt,
        }));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "POST") {
      // Only admin can create invitations
      const user = await requireRole(req, ["admin"]);

      const body = await req.json();
      const { email, role } = body;

      if (!email || !role) {
        return badRequest("email and role are required");
      }

      if (role !== "admin" && role !== "worker") {
        return badRequest("role must be 'admin' or 'worker'");
      }

      // Check if user already exists with this email
      const existingUserRole = await db.query.userRole.findFirst({
        where: eq(userRole.userId, email),
      });

      if (existingUserRole) {
        return badRequest("User with this email already exists");
      }

      // Create invitation
      const invitationId = uuid();
      const token = uuid();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await db.insert(invitation).values({
        id: invitationId,
        email,
        role,
        createdBy: user.userRoleId,
        token,
        expiresAt,
        usedAt: null,
        createdAt: new Date(),
      });

      const response = {
        id: invitationId,
        email,
        role,
        token,
        expiresAt,
        createdAt: new Date(),
      };

      return new Response(JSON.stringify(response), {
        status: 201,
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

    if (message === "Forbidden") {
      return forbidden();
    }

    return serverError(message);
  }
}
