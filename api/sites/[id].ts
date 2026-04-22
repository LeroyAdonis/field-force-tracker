import { requireAuth, requireRole, badRequest, serverError, forbidden } from "../../src/lib/api/middleware.js";
import { db, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return badRequest("Site ID is required");
  }

  try {
    if (req.method === "GET") {
      await requireAuth(req);

      const s = await db.query.site.findFirst({
        where: eq(site.id, id),
      });

      if (!s) {
        return new Response(JSON.stringify({ error: "Site not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const response = {
        id: s.id,
        name: s.name,
        address: s.address,
        zone: s.zone,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "PATCH") {
      // Only admin can update sites
      await requireRole(req, ["admin"]);

      const s = await db.query.site.findFirst({
        where: eq(site.id, id),
      });

      if (!s) {
        return new Response(JSON.stringify({ error: "Site not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      const { name, address, zone, active } = body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (zone !== undefined) updates.zone = zone;
      if (active !== undefined) updates.active = active;
      updates.updatedAt = new Date().toISOString();

      await db.update(site).set(updates).where(eq(site.id, id));

      // Fetch updated site
      const updated = await db.query.site.findFirst({
        where: eq(site.id, id),
      });

      const response = {
        id: updated?.id,
        name: updated?.name,
        address: updated?.address,
        zone: updated?.zone,
        active: updated?.active,
        createdAt: updated?.createdAt,
        updatedAt: updated?.updatedAt,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "DELETE") {
      // Only admin can delete sites
      await requireRole(req, ["admin"]);

      const s = await db.query.site.findFirst({
        where: eq(site.id, id),
      });

      if (!s) {
        return new Response(JSON.stringify({ error: "Site not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.delete(site).where(eq(site.id, id));

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
