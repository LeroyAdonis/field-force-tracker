import { requireAuth, badRequest, serverError, forbidden } from "../../src/lib/api/middleware.js";
import { db, visit, worker, inspection, photo, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) return badRequest("Visit ID is required");

  try {
    const user = await requireAuth(req);

    if (req.method === "GET") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: { with: { userRole: { with: { user: true } } } },
          site: true,
          inspections: { with: { photos: true } },
        },
      });

      if (!v) return new Response(JSON.stringify({ error: "Visit not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return forbidden();

      const ir = v.inspections?.[0];
      return new Response(JSON.stringify({
        id: v.id,
        workerId: v.workerId,
        workerName: v.worker?.userRole?.displayName || "Unknown",
        siteId: v.siteId,
        siteName: v.site?.name || "Unknown Site",
        date: v.date,
        timestamp: v.timestamp,
        km: v.km,
        inspection: ir ? { id: ir.id, type: ir.type, notes: ir.notes, timestamp: ir.timestamp, photos: ir.photos.map((p) => ({ id: p.id, dataUrl: p.dataUrl, caption: p.caption })) } : null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "PATCH") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: { worker: true, inspections: true },
      });

      if (!v) return new Response(JSON.stringify({ error: "Visit not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return forbidden();

      const body = await req.json();
      const { km, notes, inspectionType } = body;
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

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (req.method === "DELETE") {
      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: { worker: true },
      });

      if (!v) return new Response(JSON.stringify({ error: "Visit not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) return forbidden();

      await db.delete(visit).where(eq(visit.id, id));
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    if (message === "Forbidden") return forbidden();
    return serverError(message);
  }
}
