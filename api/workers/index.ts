import { requireAuthNode, requireRoleNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, worker, userRole, user } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
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
      const admin = await requireRoleNode(req, ["admin"]);
      const body = await readJsonBody(req);
      const { email, displayName, jobTitle, dailyKmTarget, avatar } = body as {
        email?: string;
        displayName?: string;
        jobTitle?: string;
        dailyKmTarget?: number;
        avatar?: string;
      };

      if (!email || !displayName || !jobTitle) {
        return send(400, { error: "email, displayName, and jobTitle are required" });
      }

      const existingUser = await db.query.user.findFirst({ where: eq(user.email, email) });
      if (existingUser) {
        return send(409, { error: "A user with this email already exists" });
      }

      const nowIso = new Date().toISOString();
      const userId = randomUUID();
      const userRoleId = randomUUID();
      const workerId = randomUUID();

      await db.insert(user).values({
        id: userId,
        email,
        name: displayName,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await db.insert(userRole).values({
        id: userRoleId,
        userId,
        role: "worker",
        displayName,
        avatar: avatar || `https://i.pravatar.cc/120?u=${userId}`,
        active: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await db.insert(worker).values({
        id: workerId,
        userRoleId,
        jobTitle,
        dailyKmTarget: dailyKmTarget ?? 60,
        active: true,
        isDemo: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      return send(201, {
        id: workerId,
        userId,
        email,
        displayName,
        avatar: avatar || `https://i.pravatar.cc/120?u=${userId}`,
        jobTitle,
        dailyKmTarget: dailyKmTarget ?? 60,
        active: true,
        isDemo: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    if (message === "Forbidden") return send(403, { error: "Forbidden" });
    return send(500, { error: message });
  }
}
