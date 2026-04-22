import { requireAuth, requireRole, forbidden, badRequest, serverError } from "../../src/lib/api/middleware.js";
import { db, worker, userRole } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";

type WorkerResponse = {
  id: string;
  userId?: string | null;
  email?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  jobTitle?: string | null;
  dailyKmTarget?: number | null;
  active?: boolean | null;
  isDemo?: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Worker ID is required");
  }

  try {
    if (req.method === "GET") {
      const user = await requireAuth(req);

      const w = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: {
          userRole: {
            with: {
              user: true,
            },
          },
        },
      });

      if (!w) {
        return new Response(
          JSON.stringify({ error: "Worker not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Workers can only see themselves, admins can see all
      if (user.role !== "admin" && w.id !== user.userRoleId) {
        return forbidden();
      }

      const response: WorkerResponse = {
        id: w.id,
        userId: w.userRole?.userId || null,
        email: w.userRole?.user?.email || null,
        displayName: w.userRole?.displayName || null,
        avatar: w.userRole?.avatar || null,
        jobTitle: w.jobTitle,
        dailyKmTarget: w.dailyKmTarget,
        active: w.active,
        isDemo: w.isDemo,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "PATCH") {
      const user = await requireAuth(req);

      const w = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: {
          userRole: true,
        },
      });

      if (!w) {
        return new Response(
          JSON.stringify({ error: "Worker not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Workers can only update themselves, admins can update anyone
      if (user.role !== "admin" && w.id !== user.userRoleId) {
        return forbidden();
      }

      const body = await req.json();
      const { displayName, jobTitle, dailyKmTarget, active, avatar } = body;

      const updates: Record<string, unknown> = {};
      if (jobTitle !== undefined) updates.jobTitle = jobTitle;
      if (dailyKmTarget !== undefined) updates.dailyKmTarget = dailyKmTarget;
      if (active !== undefined) updates.active = active;
      if (displayName !== undefined && w.userRole) {
        // Update userRole displayName separately
        await db
          .update(userRole)
          .set({ displayName })
          .where(eq(userRole.id, w.userRole.id));
      }
      if (avatar !== undefined && w.userRole) {
        // Update userRole avatar separately
        await db
          .update(userRole)
          .set({ avatar })
          .where(eq(userRole.id, w.userRole.id));
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await db.update(worker).set(updates).where(eq(worker.id, id));
      }

      // Fetch updated worker
      const updated = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: {
          userRole: {
            with: {
              user: true,
            },
          },
        },
      });

      const response: WorkerResponse = {
        id: updated?.id!,
        userId: updated?.userRole?.userId || null,
        email: updated?.userRole?.user?.email || null,
        displayName: updated?.userRole?.displayName || null,
        avatar: updated?.userRole?.avatar || null,
        jobTitle: updated?.jobTitle,
        dailyKmTarget: updated?.dailyKmTarget,
        active: updated?.active,
        isDemo: updated?.isDemo,
        createdAt: updated?.createdAt ?? null,
        updatedAt: updated?.updatedAt ?? null,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "DELETE") {
      // Only admin can delete workers
      await requireRole(req, ["admin"]);

      const w = await db.query.worker.findFirst({
        where: eq(worker.id, id),
      });

      if (!w) {
        return new Response(
          JSON.stringify({ error: "Worker not found" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await db.delete(worker).where(eq(worker.id, id));

      return new Response(JSON.stringify({ success: true }), {
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

    if (message === "Forbidden") {
      return forbidden();
    }

    return serverError(message);
  }
}