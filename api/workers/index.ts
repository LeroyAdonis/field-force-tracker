import { requireAuthNode, requireRoleNode, sendJson } from "../../src/lib/api/middleware.js";
import { db, worker, userRole } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  try {
    if (req.method === "GET") {
      const user = await requireAuthNode(req);

      let workers;
      if (user.role === "admin") {
        workers = await db.query.worker.findMany({
          with: { userRole: { with: { user: true } } },
        });
      } else {
        const selfWorker = await db.query.worker.findFirst({
          where: eq(worker.userRoleId, user.userRoleId),
          with: { userRole: { with: { user: true } } },
        });
        workers = selfWorker ? [selfWorker] : [];
      }

      return send(200, workers.map((w) => ({
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
      })));
    }

    if (req.method === "POST") {
      await requireRoleNode(req, ["admin"]);
      return send(400, { error: "Use invitation flow to create workers" });
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    if (message === "Forbidden") return send(403, { error: "Forbidden" });
    return send(500, { error: message });
  }
}
