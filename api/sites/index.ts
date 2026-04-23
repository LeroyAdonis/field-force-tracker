import { requireAuthNode, requireRoleNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, site } from "../../src/lib/db/index.js";
import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  try {
    if (req.method === "GET") {
      await requireAuthNode(req);

      const sites = await db.query.site.findMany();

      return send(200, sites.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        zone: s.zone,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })));
    }

    if (req.method === "POST") {
      await requireRoleNode(req, ["admin"]);

      const body = await readJsonBody(req);
      const { name, address, zone } = body as { name?: string; address?: string; zone?: string };

      if (!name || !address || !zone) {
        return send(400, { error: "name, address, and zone are required" });
      }

      const nowIso = new Date().toISOString();
      const newSite = { id: randomUUID(), name, address, zone, active: true, createdAt: nowIso, updatedAt: nowIso };

      await db.insert(site).values(newSite);

      return send(201, newSite);
    }

    return send(405, { error: "Method not allowed" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") return send(401, { error: "Unauthorized" });
    if (message === "Forbidden") return send(403, { error: "Forbidden" });
    return send(500, { error: message });
  }
}
