import { requireAuth, badRequest, serverError, forbidden } from "../../src/lib/api/middleware.js";
import { db, visit, inspection, photo, worker, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
            inspections: {
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
            inspections: {
              with: {
                photos: true,
              },
            },
          },
        });
      }

      const response = visits.map((v) => {
        const inspectionRecord = v.inspections?.[0];
        return {
          id: v.id,
          workerId: v.workerId,
          workerName: v.worker?.userRole?.displayName,
          siteId: v.siteId,
          siteName: v.site?.name,
          date: v.date,
          timestamp: v.timestamp,
          km: v.km,
          inspection: inspectionRecord
            ? {
                id: inspectionRecord.id,
                type: inspectionRecord.type,
                notes: inspectionRecord.notes,
                timestamp: inspectionRecord.timestamp,
                photos: inspectionRecord.photos.map((p) => ({
                  id: p.id,
                  dataUrl: p.dataUrl,
                  caption: p.caption,
                })),
              }
            : null,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      });

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
      const visitId = randomUUID();
      const nowIso = new Date().toISOString();

      await db.insert(visit).values({
        id: visitId,
        workerId,
        siteId,
        date,
        timestamp: nowIso,
        km,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // Create inspection if provided
      let inspectionData: {
        id: string;
        type: string;
        notes: string | null;
        timestamp: string;
        photos: { id: string; dataUrl: string; caption: string | null }[];
      } | null = null;
      if (inspectionType) {
        const inspectionId = randomUUID();
        const photosData: { id: string; dataUrl: string; caption: string | null }[] = [];

        await db.insert(inspection).values({
          id: inspectionId,
          visitId,
          type: inspectionType,
          notes: notes || null,
          timestamp: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        if (photos && Array.isArray(photos)) {
          for (const p of photos) {
            const photoId = randomUUID();
            await db.insert(photo).values({
              id: photoId,
              inspectionId,
              dataUrl: p.dataUrl,
              caption: p.caption || null,
              createdAt: nowIso,
            });
            photosData.push({
              id: photoId,
              dataUrl: p.dataUrl,
              caption: p.caption || null,
            });
          }
        }

        inspectionData = {
          id: inspectionId,
          type: inspectionType,
          notes: notes || null,
          timestamp: nowIso,
          photos: photosData,
        };
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
        timestamp: nowIso,
        km,
        inspection: inspectionData,
        createdAt: nowIso,
        updatedAt: nowIso,
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
