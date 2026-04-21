import { requireAuth, requireRole, forbidden, badRequest, serverError } from "../../src/lib/api/middleware";
import { db, worker, userRole } from "../../src/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      const user = await requireAuth(req);

      // Admin can list all workers, workers can only see their own
      let workers;
      if (user.role === "admin") {
        workers = await db.query.worker.findMany({
          with: {
            userRole: {
              with: {
                user: true,
              },
            },
          },
        });
      } else {
        // Worker can only see themselves
        const selfWorker = await db.query.worker.findFirst({
          where: eq(worker.userRoleId, user.userRoleId),
          with: {
            userRole: {
              with: {
                user: true,
              },
            },
          },
        });
        workers = selfWorker ? [selfWorker] : [];
      }

      const response = workers.map((w) => ({
        id: w.id,
        userId: w.userRole?.userId,
        email: w.userRole?.user?.email,
        displayName: w.userRole?.displayName,
        avatar: w.userRole?.avatar,
        jobTitle: w.jobTitle,
        dailyKmTarget: w.dailyKmTarget,
        active: w.active,
        isDemo: w.isDemo,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "POST") {
      // Only admin can create workers
      await requireRole(req, ["admin"]);

      const body = await req.json();
      const { email, displayName, jobTitle, dailyKmTarget, isDemo } = body;

      if (!email || !displayName) {
        return badRequest("email and displayName are required");
      }

      // Check if user already exists
      const existingUser = await db.query.user.findFirst({
        where: eq(userRole.userId, email),
      });

      if (existingUser) {
        return badRequest("User already exists");
      }

      // Create new worker (requires manual user/userRole creation first via invitation flow)
      // For now, just validate structure
      return new Response(JSON.stringify({ error: "Use invitation flow to create workers" }), {
        status: 400,
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
