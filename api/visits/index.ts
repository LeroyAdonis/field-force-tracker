import { requireAuth, badRequest, serverError, forbidden } from "../../src/lib/api/middleware";
import { db, visit, inspection, photo, worker, site } from "../../src/lib/db";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      const user = await requireAuth(req);

      let visits;
      if (user.role === "admin") {
        // Admin can see all visits
        visits = await db.query.visit.findMany({
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
      } else {
        // Worker can only see their own visits
        const workerRecord = await db.query.worker.findFirst({
          where: eq(worker.userRoleId, user.userRoleId),
        });

        if (!workerRecord) {
          return new Response(JSON.stringify({ error: "Worker record not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        visits = await db.query.visit.findMany({
          where: eq(visit.workerId, workerRecord.id),
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
      }

      const response = visits.map((v) => ({
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
      }));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "POST") {
      const user = await requireAuth(req);

      const body = await req.json();
      const { workerId, siteId, date, km, inspectionType, notes, photos } = body;

      if (!workerId || !siteId || !date || !km) {
        return badRequest("workerId, siteId, date, and km are required");
      }

      // Check if user is creating for themselves or is admin
      const workerRecord = await db.query.worker.findFirst({
        where: eq(worker.id, workerId),
      });

      if (!workerRecord) {
        return new Response(JSON.stringify({ error: "Worker not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (user.role !== "admin" && workerRecord.userRoleId !== user.userRoleId) {
        return forbidden();
      }

      // Create visit
      const visitId = uuid();
      const timestamp = new Date();

      await db.insert(visit).values({
        id: visitId,
        workerId,
        siteId,
        date,
        timestamp,
        km,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      // Create inspection if provided
      let inspectionData = null;
      if (inspectionType) {
        const inspectionId = uuid();
        inspectionData = {
          id: inspectionId,
          type: inspectionType,
          notes: notes || null,
          timestamp,
        };

        await db.insert(inspection).values({
          id: inspectionId,
          visitId,
          type: inspectionType,
          notes: notes || null,
          timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        // Create photos if provided
        const photosData: { id: string; dataUrl: string; caption: string | null }[] = [];
        if (photos && Array.isArray(photos)) {
          for (const p of photos) {
            const photoId = uuid();
            await db.insert(photo).values({
              id: photoId,
              inspectionId,
              dataUrl: p.dataUrl,
              caption: p.caption || null,
              createdAt: timestamp,
            });
            photosData.push({
              id: photoId,
              dataUrl: p.dataUrl,
              caption: p.caption || null,
            });
          }
        }

        inspectionData.photos = photosData;
      }

      // Fetch site for response
      const siteRecord = await db.query.site.findFirst({
        where: eq(site.id, siteId),
      });

      const response = {
        id: visitId,
        workerId,
        siteId,
        siteName: siteRecord?.name,
        date,
        timestamp,
        km,
        inspection: inspectionData,
        createdAt: timestamp,
        updatedAt: timestamp,
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
