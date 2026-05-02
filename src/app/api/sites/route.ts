import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true" && session.user.role === "admin";

  const rows = all
    ? await db.select().from(sites).orderBy(asc(sites.name))
    : await db.select().from(sites).where(eq(sites.status, "active")).orderBy(asc(sites.name));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, address, region, latitude, longitude } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const [site] = await db
    .insert(sites)
    .values({ name, address, region, latitude, longitude, createdBy: session.user.id })
    .returning();

  return NextResponse.json(site, { status: 201 });
}
