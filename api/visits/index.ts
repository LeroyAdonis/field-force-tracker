import { requireAuthNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, visit, inspection, photo, worker, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  try {
    if (req.method === "GET") {
      const user = await requireAuthNode(req);

      let visits;
      if (user.role === "admin") {
        visits = await db.query.visit.findMany({
          with: {
            worker: { with: { userRole: { with: { user: true } } } },
            site: true,
            inspections: { with: { photos: true } },
          },
        });
      } else {
        const workerRecord = await db.query.worker.findFirst({
          where: eq(worker.userRoleId, user.userRoleId),
        });

        if (!workerRecord) return send(404, { error: "Worker record not found" });

        visits = await db.query.visit.findMany({
          where: eq(visit.workerId, workerRecord.id),
          with: {
            worker: { with: { userRole: { with: { user: true } } } },
            site: true,
            inspections: { with: { photos: true } },
          },
        });
      }

      return send(200, visits.map((v) => {
        const ir = v.inspections?.[0];
        return {
          id: v.id,
          workerId: v.workerId,
          workerName: v.worker?.userRole?.displayName,
          siteId: v.siteId,
          siteName: v.site?.name,
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
        };
      }));
    }

    if (req.method === "POST") {
      const user = await requireAuthNode(req);

      const body = await readJsonBody(req);
      const { workerId, siteId, date, km, inspectionType, notes, photos: photoList } = body as {
        workerId?: string;
        siteId?: string;
        date?: string;
        km?: string | number;
        inspectionType?: string;
        notes?: string;
        photos?: { dataUrl: string; caption?: string }[];
      };

      if (!workerId || !siteId || !date || !km) {
        return send(400, { error: "workerId, siteId, date, and km are required" });
      }

      const workerRecord = await db.query.worker.findFirst({ where: eq(worker.id, workerId) });
      if (!workerRecord) return send(404, { error: "Worker not found" });

      if (user.role !== "admin" && workerRecord.userRoleId !== user.userRoleId) {
        return send(403, { error: "Forbidden" });
      }

      const visitId = randomUUID();
      const nowIso = new Date().toISOString();

      await db.insert(visit).values({
        id: visitId,
        workerId,
        siteId,
        date,
        timestamp: nowIso,
        km: String(km),
        createdAt: nowIso,
        updatedAt: nowIso,
      });

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

        if (photoList && Array.isArray(photoList)) {
          for (const p of photoList) {
            const photoId = randomUUID();
            await db.insert(photo).values({
              id: photoId,
              inspectionId,
              dataUrl: p.dataUrl,
              caption: p.caption || null,
              createdAt: nowIso,
            });
            photosData.push({ id: photoId, dataUrl: p.dataUrl, caption: p.caption || null });
          }
        }

        inspectionData = { id: inspectionId, type: inspectionType, notes: notes || null, timestamp: nowIso, photos: photosData };
      }

      const siteRecord = await db.query.site.findFirst({ where: eq(site.id, siteId) });

      return send(201, {
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
