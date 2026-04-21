import { requireAuth, badRequest, serverError, forbidden } from "../../src/lib/api/middleware.js";
import { db, visit, worker, inspection, photo, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";

export default async function handler(req: Request): Promise<Response> {
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
        workerName: v.worker?.userRole?.displayName || "Unknown",
        siteId: v.siteId,
        siteName: v.site?.name || "Unknown Site",
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
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error fetching visit:", error);
    return serverError(message);
  }
}