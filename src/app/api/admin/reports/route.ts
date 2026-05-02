import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { siteVisits, users, sites } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate")!;
  const endDate = searchParams.get("endDate")!;
  const workerId = searchParams.get("workerId");

  const conditions: any[] = [
    gte(siteVisits.visitDate, startDate),
    lte(siteVisits.visitDate, endDate),
  ];
  if (workerId) conditions.push(eq(siteVisits.workerId, workerId));

  const visits = await db
    .select({ visit: siteVisits, worker: users, site: sites })
    .from(siteVisits)
    .leftJoin(users, eq(siteVisits.workerId, users.id))
    .leftJoin(sites, eq(siteVisits.siteId, sites.id))
    .where(and(...conditions))
    .orderBy(desc(siteVisits.visitDate));

  return NextResponse.json(visits);
}
