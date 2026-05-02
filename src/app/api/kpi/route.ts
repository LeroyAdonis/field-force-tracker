import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getWorkerDayKPI, getWorkerPeriodKPI,
  workingDaysInWeek, workingDaysInMonth,
  getAllWorkersKPI
} from "@/lib/kpi";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "self";

  if (scope === "all" && session.user.role === "admin") {
    const data = await getAllWorkersKPI();
    return NextResponse.json(data);
  }

  const workerId = session.user.id;
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [dayKPI, weekKPI, monthKPI] = await Promise.all([
    getWorkerDayKPI(workerId, today),
    getWorkerPeriodKPI(workerId, weekStart, weekEnd, workingDaysInWeek(now)),
    getWorkerPeriodKPI(workerId, monthStart, monthEnd, workingDaysInMonth(now)),
  ]);

  return NextResponse.json({ today: dayKPI, week: weekKPI, month: monthKPI });
}
