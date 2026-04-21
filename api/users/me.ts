import { requireAuth } from "../../src/lib/api/middleware.js";
import { db, userRole, worker } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const user = await requireAuth(req);

    // Get complete user profile with worker data if applicable
    const userWithWorker = await db.query.userRole.findFirst({
      where: eq(userRole.userId, user.userId),
      with: {
        user: true,
        worker: true,
      },
    });

    if (!userWithWorker) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build response with user + role + worker data
    const response = {
      id: userWithWorker.user?.id ?? null,
      email: userWithWorker.user?.email ?? null,
      name: userWithWorker.user?.name ?? null,
      avatar: userWithWorker.avatar,
      role: userWithWorker.role,
      displayName: userWithWorker.displayName ?? null,
      active: userWithWorker.active,
      ...(userWithWorker.worker && {
        workerId: userWithWorker.worker?.id ?? null,
        jobTitle: userWithWorker.worker?.jobTitle ?? null,
        dailyKmTarget: userWithWorker.worker?.dailyKmTarget ?? null,
        isDemo: userWithWorker.worker?.isDemo ?? null,
      }),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
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

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}