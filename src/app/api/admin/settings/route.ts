import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { kpiSettings, workerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getGlobalKpiSettings } from "@/lib/kpi";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const settings = await getGlobalKpiSettings();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const current = await getGlobalKpiSettings();
  const [updated] = await db.update(kpiSettings)
    .set({ ...body, updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(kpiSettings.id, current.id)).returning();
  return NextResponse.json(updated);
}
