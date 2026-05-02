import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { inspections, siteVisits } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const visitId = searchParams.get("visitId");

  if (!visitId) return NextResponse.json({ error: "visitId required" }, { status: 400 });

  const rows = await db.select().from(inspections)
    .where(eq(inspections.visitId, parseInt(visitId)))
    .orderBy(desc(inspections.timestamp));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { visitId, siteId, inspectionType, findings, passed } = body;

  if (!visitId || !inspectionType)
    return NextResponse.json({ error: "visitId and inspectionType required" }, { status: 400 });

  // Get visit to get siteId and date
  const [visit] = await db.select().from(siteVisits).where(eq(siteVisits.id, visitId)).limit(1);
  if (!visit) return NextResponse.json({ error: "Visit not found" }, { status: 404 });

  const [inspection] = await db.insert(inspections).values({
    visitId,
    workerId: session.user.id,
    siteId: siteId || visit.siteId,
    visitDate: visit.visitDate,
    inspectionType,
    findings,
    passed: passed !== undefined ? passed : true,
    timestamp: new Date(),
  }).returning();

  return NextResponse.json(inspection, { status: 201 });
}
