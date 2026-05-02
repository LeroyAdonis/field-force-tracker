import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, workerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const workers = await db
    .select({ user: users, profile: workerProfiles })
    .from(users)
    .leftJoin(workerProfiles, eq(users.id, workerProfiles.userId))
    .where(eq(users.role, "worker"));

  return NextResponse.json(workers);
}
