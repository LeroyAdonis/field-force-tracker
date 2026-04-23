import { requireAuthNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, visit, worker, inspection } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  const url = new URL(req.url!, "http://localhost");
  const id = url.pathname.split("/").pop();

  if (!id) return send(400, { error: "Visit ID is required" });

  try {
    const user = await requireAuthNode(req);

    if (req.method === "GET") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: { with: { userRole: { with: { user: true } } } },
          site: true,
          inspections: { with: { photos: true } },
        },
      });

      if (!v) return send(404, { error: "Visit not found" });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return send(403, { error: "Forbidden" });

      const ir = v.inspections?.[0];
      return send(200, {
        id: v.id,
        workerId: v.workerId,
        workerName: v.worker?.userRole?.displayName || "Unknown",
        siteId: v.siteId,
        siteName: v.site?.name || "Unknown Site",
        date: v.date,
        timestamp: v.timestamp,
        km: v.km,
        inspection: ir
          ? {
              id: ir.id,
              type: ir.type,
              notes: ir.notes,
              timestamp: ir.timestamp,
              photos: ir.photos.map((p) => ({ id: p.id, dataUrl: p.dataUrl, caption: p.caption })),
            }
          : null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      });
    }

    if (req.method === "PATCH") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: { worker: true, inspections: true },
      });

      if (!v) return send(404, { error: "Visit not found" });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return send(403, { error: "Forbidden" });

      const body = await readJsonBody(req);
      const { km, notes, inspectionType } = body as { km?: string | number; notes?: string; inspectionType?: string };
      const nowIso = new Date().toISOString();

      if (km !== undefined) {
        await db.update(visit).set({ km: String(km), updatedAt: nowIso }).where(eq(visit.id, id));
      }

      const ir = v.inspections?.[0];
      if (ir) {
        const inspUpdates: Record<string, unknown> = { updatedAt: nowIso };
        if (notes !== undefined) inspUpdates.notes = notes;
        if (inspectionType !== undefined) inspUpdates.type = inspectionType;
        if (Object.keys(inspUpdates).length > 1) {
          await db.update(inspection).set(inspUpdates).where(eq(inspection.id, ir.id));
        }
      }

      return send(200, { success: true });
    }

    if (req.method === "DELETE") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: { worker: true },
      });

      if (!v) return send(404, { error: "Visit not found" });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return send(403, { error: "Forbidden" });

      await db.delete(visit).where(eq(visit.id, id));
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
