import { requireAuthNode, requireRoleNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, worker, userRole } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

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

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  const url = new URL(req.url!, "http://localhost");
  const id = url.pathname.split("/").pop();

  if (!id) return send(400, { error: "Worker ID is required" });

  try {
    if (req.method === "GET") {
      const user = await requireAuthNode(req);

      const w = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: { userRole: { with: { user: true } } },
      });

      if (!w) return send(404, { error: "Worker not found" });

      if (user.role !== "admin" && w.id !== user.userRoleId) return send(403, { error: "Forbidden" });

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

      return send(200, response);
    }

    if (req.method === "PATCH") {
      const user = await requireAuthNode(req);

      const w = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: { userRole: true },
      });

      if (!w) return send(404, { error: "Worker not found" });
      if (user.role !== "admin" && w.id !== user.userRoleId) return send(403, { error: "Forbidden" });

      const body = await readJsonBody(req);
      const { displayName, jobTitle, dailyKmTarget, active, avatar } = body as Record<string, unknown>;

      const updates: Record<string, unknown> = {};
      if (jobTitle !== undefined) updates.jobTitle = jobTitle;
      if (dailyKmTarget !== undefined) updates.dailyKmTarget = dailyKmTarget;
      if (active !== undefined) updates.active = active;

      if (displayName !== undefined && w.userRole) {
        await db.update(userRole).set({ displayName: displayName as string }).where(eq(userRole.id, w.userRole.id));
      }
      if (avatar !== undefined && w.userRole) {
        await db.update(userRole).set({ avatar: avatar as string }).where(eq(userRole.id, w.userRole.id));
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await db.update(worker).set(updates).where(eq(worker.id, id));
      }

      const updated = await db.query.worker.findFirst({
        where: eq(worker.id, id),
        with: { userRole: { with: { user: true } } },
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

      return send(200, response);
    }

    if (req.method === "DELETE") {
      await requireRoleNode(req, ["admin"]);

      const w = await db.query.worker.findFirst({ where: eq(worker.id, id) });
      if (!w) return send(404, { error: "Worker not found" });

      await db.delete(worker).where(eq(worker.id, id));
      return send(200, { success: true });
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    if (message === "Forbidden") return send(403, { error: "Forbidden" });
    return send(500, { error: message });
  }
}
