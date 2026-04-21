import { requireAuth, badRequest, serverError, forbidden } from "../../src/lib/api/middleware.js";
import { db, visit, worker, inspection, photo } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Visit ID is required");
  }

  try {
    if (req.method === "GET") {
      const user = await requireAuth(req);

      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: {
            with: {
              userRole: {
                with: {
                  user: true,
                },
              },
            },
          },
          site: true,
          inspection: {
            with: {
              photos: true,
            },
          },
        },
      });

      if (!v) {
        return new Response(JSON.stringify({ error: "Visit not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Workers can only see their own visits, admins can see all
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) {
        return forbidden();
      }

      const response = {
        id: v.id,
        workerId: v.workerId,
        workerName: v.worker?.userRole?.displayName,
        siteId: v.siteId,
        siteName: v.site?.name,
        date: v.date,
        timestamp: v.timestamp,
        km: v.km,
        inspection: v.inspection
          ? {
              id: v.inspection.id,
              type: v.inspection.type,
              notes: v.inspection.notes,
              timestamp: v.inspection.timestamp,
              photos: v.inspection.photos.map((p) => ({
                id: p.id,
                dataUrl: p.dataUrl,
                caption: p.caption,
              })),
            }
          : null,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "PATCH") {
      const user = await requireAuth(req);

      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: {
            with: {
              userRole: true,
            },
          },
        },
      });

      if (!v) {
        return new Response(JSON.stringify({ error: "Visit not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Workers can only update their own visits, admins can update any
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) {
        return forbidden();
      }

      const body = await req.json();
      const { date, km, inspectionType, notes } = body;

      const updates: Record<string, unknown> = {};
      if (date !== undefined) updates.date = date;
      if (km !== undefined) updates.km = km;
      updates.updatedAt = new Date();

      await db.update(visit).set(updates).where(eq(visit.id, id));

      // Update inspection if provided
      if (inspectionType !== undefined || notes !== undefined) {
        const existingInspection = await db.query.inspection.findFirst({
          where: eq(inspection.visitId, id),
        });

        if (existingInspection) {
          const inspectionUpdates: Record<string, unknown> = {};
          if (inspectionType !== undefined) inspectionUpdates.type = inspectionType;
          if (notes !== undefined) inspectionUpdates.notes = notes;
          inspectionUpdates.updatedAt = new Date();

          await db
            .update(inspection)
            .set(inspectionUpdates)
            .where(eq(inspection.id, existingInspection.id));
        }
      }

      // Fetch updated visit
      const updated = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: {
            with: {
              userRole: {
                with: {
                  user: true,
                },
              },
            },
          },
          site: true,
          inspection: {
            with: {
              photos: true,
            },
          },
        },
      });

      const response = {
        id: updated?.id,
        workerId: updated?.workerId,
        workerName: updated?.worker?.userRole?.displayName,
        siteId: updated?.siteId,
        siteName: updated?.site?.name,
        date: updated?.date,
        timestamp: updated?.timestamp,
        km: updated?.km,
        inspection: updated?.inspection
          ? {
              id: updated.inspection.id,
              type: updated.inspection.type,
              notes: updated.inspection.notes,
              timestamp: updated.inspection.timestamp,
              photos: updated.inspection.photos.map((p) => ({
                id: p.id,
                dataUrl: p.dataUrl,
                caption: p.caption,
              })),
            }
          : null,
        createdAt: updated?.createdAt,
        updatedAt: updated?.updatedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "DELETE") {
      const user = await requireAuth(req);

      const v = await db.query.visit.findFirst({
        where: eq(visit.id, id),
        with: {
          worker: {
            with: {
              userRole: true,
            },
          },
        },
      });

      if (!v) {
        return new Response(JSON.stringify({ error: "Visit not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Workers can only delete their own visits, admins can delete any
      if (user.role !== "admin" && v.worker?.userRoleId !== user.userRoleId) {
        return forbidden();
      }

      // Delete will cascade to inspections and photos
      await db.delete(visit).where(eq(visit.id, id));

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
