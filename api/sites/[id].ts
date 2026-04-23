import { requireAuthNode, requireRoleNode, readJsonBody, sendJson } from "../../src/lib/api/middleware.js";
import { db, site } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const send = (status: number, body: unknown) => sendJson(res, status, body);

  const url = new URL(req.url!, "http://localhost");
  const id = url.pathname.split("/").pop();

  if (!id) return send(400, { error: "Site ID is required" });

  try {
    if (req.method === "GET") {
      await requireAuthNode(req);

      const s = await db.query.site.findFirst({ where: eq(site.id, id) });

      if (!s) return send(404, { error: "Site not found" });

      return send(200, {
        id: s.id,
        name: s.name,
        address: s.address,
        zone: s.zone,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      });
    }

    if (req.method === "PATCH") {
      await requireRoleNode(req, ["admin"]);

      const s = await db.query.site.findFirst({ where: eq(site.id, id) });
      if (!s) return send(404, { error: "Site not found" });

      const body = await readJsonBody(req);
      const { name, address, zone, active } = body as Record<string, unknown>;

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (zone !== undefined) updates.zone = zone;
      if (active !== undefined) updates.active = active;

      await db.update(site).set(updates).where(eq(site.id, id));

      const updated = await db.query.site.findFirst({ where: eq(site.id, id) });

      return send(200, {
        id: updated?.id,
        name: updated?.name,
        address: updated?.address,
        zone: updated?.zone,
        active: updated?.active,
        createdAt: updated?.createdAt,
        updatedAt: updated?.updatedAt,
      });
    }

    if (req.method === "DELETE") {
      await requireRoleNode(req, ["admin"]);

      const s = await db.query.site.findFirst({ where: eq(site.id, id) });
      if (!s) return send(404, { error: "Site not found" });

      await db.delete(site).where(eq(site.id, id));
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
