import { requireAuth, requireRole, forbidden, badRequest, serverError } from "../../src/lib/api/middleware.js";
import { db, site } from "../../src/lib/db/index.js";
import { randomUUID } from "crypto";

export default async function handler(req: Request) {
  try {
    if (req.method === "GET") {
      await requireAuth(req);

      const sites = await db.query.site.findMany();

      const response = sites.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        zone: s.zone,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (req.method === "POST") {
      // Only admin can create sites
      await requireRole(req, ["admin"]);

      const body = await req.json();
      const { name, address, zone } = body;

      if (!name || !address || !zone) {
        return badRequest("name, address, and zone are required");
      }

      const newSite = {
        id: randomUUID(),
        name,
        address,
        zone,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(site).values(newSite);

      return new Response(JSON.stringify(newSite), {
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
