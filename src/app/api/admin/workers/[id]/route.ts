import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, workerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, dailyVisitTarget, dailyKmTarget, region, phone, employeeId } = body;

  if (name || email) {
    await db.update(users).set({ name, email, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  const profileData: any = {};
  if (dailyVisitTarget !== undefined) profileData.dailyVisitTarget = dailyVisitTarget;
  if (dailyKmTarget !== undefined) profileData.dailyKmTarget = dailyKmTarget;
  if (region !== undefined) profileData.region = region;
  if (phone !== undefined) profileData.phone = phone;
  if (employeeId !== undefined) profileData.employeeId = employeeId;

  if (Object.keys(profileData).length > 0) {
    const existing = await db.select().from(workerProfiles).where(eq(workerProfiles.userId, id)).limit(1);
    if (existing.length > 0) {
      await db.update(workerProfiles).set({ ...profileData, updatedAt: new Date() }).where(eq(workerProfiles.userId, id));
    } else {
      await db.insert(workerProfiles).values({ userId: id, ...profileData });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ success: true });
}
