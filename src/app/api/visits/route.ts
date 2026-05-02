import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { siteVisits, sites } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const workerId = session.user.role === "admin"
    ? (searchParams.get("workerId") || session.user.id)
    : session.user.id;

  const visits = await db
    .select({ visit: siteVisits, site: sites })
    .from(siteVisits)
    .leftJoin(sites, eq(siteVisits.siteId, sites.id))
    .where(and(eq(siteVisits.workerId, workerId), eq(siteVisits.visitDate, date)))
    .orderBy(desc(siteVisits.createdAt));

  return NextResponse.json(visits);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { siteId, siteName, visitDate, arrivalTime, departureTime, kmCovered, notes } = body;

  if (!visitDate) return NextResponse.json({ error: "visitDate required" }, { status: 400 });

  let resolvedSiteId = siteId;

  // If no siteId but siteName provided, create the site on-the-fly
  if (!resolvedSiteId && siteName) {
    const [newSite] = await db
      .insert(sites)
      .values({ name: siteName, createdBy: session.user.id })
      .returning();
    resolvedSiteId = newSite.id;
  }

  if (!resolvedSiteId) {
    return NextResponse.json({ error: "siteId or siteName required" }, { status: 400 });
  }

  const [visit] = await db
    .insert(siteVisits)
    .values({
      workerId: session.user.id,
      siteId: resolvedSiteId,
      visitDate,
      arrivalTime: arrivalTime ? new Date(arrivalTime) : new Date(),
      departureTime: departureTime ? new Date(departureTime) : null,
      kmCovered: kmCovered ? parseFloat(kmCovered) : null,
      notes,
    })
    .returning();

  return NextResponse.json(visit, { status: 201 });
}
