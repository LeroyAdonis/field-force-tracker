import { db } from "@/db";
import {
  siteVisits,
  workerProfiles,
  kpiSettings,
  dailyKpiSnapshots,
  users,
} from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";

export type FlagStatus = "green" | "amber" | "red";

export interface WorkerKPI {
  workerId: string;
  workerName: string;
  email: string;
  today: DayKPI;
  week: PeriodKPI;
  month: PeriodKPI;
  overallFlag: FlagStatus;
}

export interface DayKPI {
  visits: number;
  visitTarget: number;
  visitPct: number;
  km: number;
  kmTarget: number;
  kmPct: number;
  visitFlag: FlagStatus;
  kmFlag: FlagStatus;
  expectedVisitPct: number;
  expectedKmPct: number;
}

export interface PeriodKPI {
  visits: number;
  visitTarget: number;
  visitPct: number;
  km: number;
  kmTarget: number;
  kmPct: number;
  flag: FlagStatus;
}

/** Compute expected % of period elapsed.
 *  For a workday (8am–6pm), 10-hour window = 600 min.
 *  We clamp to [0,1].
 */
export function expectedDayProgress(): number {
  const now = new Date();
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  const end = new Date(now);
  end.setHours(18, 0, 0, 0);
  if (now <= start) return 0;
  if (now >= end) return 1;
  return (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
}

export function expectedWeekProgress(): number {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Mon
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  // 5 working days
  const daysElapsed = Math.min(
    Math.max(
      Math.floor(
        (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
      ),
      0
    ),
    5
  );
  return Math.min(daysElapsed / 5, 1);
}

export function expectedMonthProgress(): number {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  // working days (Mon-Fri)
  let totalWorkDays = 0;
  let elapsedWorkDays = 0;
  const cur = new Date(monthStart);
  while (cur <= monthEnd) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) {
      totalWorkDays++;
      if (cur <= today) elapsedWorkDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return totalWorkDays > 0 ? elapsedWorkDays / totalWorkDays : 0;
}

export function computeFlag(
  actualPct: number,
  expectedPct: number
): FlagStatus {
  if (expectedPct < 0.05) return "green"; // too early to flag
  const ratio = expectedPct > 0 ? actualPct / expectedPct : 1;
  if (ratio >= 0.9) return "green";
  if (ratio >= 0.65) return "amber";
  return "red";
}

export async function getGlobalKpiSettings() {
  const rows = await db.select().from(kpiSettings).limit(1);
  if (rows.length > 0) return rows[0];
  // seed defaults
  const [inserted] = await db
    .insert(kpiSettings)
    .values({ defaultDailyVisitTarget: 12, defaultDailyKmTarget: 100 })
    .returning();
  return inserted;
}

export async function getWorkerTargets(workerId: string) {
  const global = await getGlobalKpiSettings();
  const profile = await db
    .select()
    .from(workerProfiles)
    .where(eq(workerProfiles.userId, workerId))
    .limit(1);
  const p = profile[0];
  return {
    dailyVisitTarget:
      p?.dailyVisitTarget ?? global.defaultDailyVisitTarget,
    dailyKmTarget: p?.dailyKmTarget ?? global.defaultDailyKmTarget,
  };
}

export async function getWorkerDayKPI(
  workerId: string,
  date: string
): Promise<DayKPI> {
  const targets = await getWorkerTargets(workerId);
  const visits = await db
    .select()
    .from(siteVisits)
    .where(
      and(
        eq(siteVisits.workerId, workerId),
        eq(siteVisits.visitDate, date)
      )
    );

  const visitCount = visits.length;
  const kmTotal = visits.reduce((s, v) => s + (v.kmCovered ?? 0), 0);

  const visitPct = Math.min(visitCount / targets.dailyVisitTarget, 1);
  const kmPct =
    targets.dailyKmTarget > 0
      ? Math.min(kmTotal / targets.dailyKmTarget, 1)
      : 0;

  const expectedPct = expectedDayProgress();

  return {
    visits: visitCount,
    visitTarget: targets.dailyVisitTarget,
    visitPct,
    km: kmTotal,
    kmTarget: targets.dailyKmTarget,
    kmPct,
    visitFlag: computeFlag(visitPct, expectedPct),
    kmFlag: computeFlag(kmPct, expectedPct),
    expectedVisitPct: expectedPct,
    expectedKmPct: expectedPct,
  };
}

export async function getWorkerPeriodKPI(
  workerId: string,
  startDate: string,
  endDate: string,
  workingDays: number
): Promise<PeriodKPI> {
  const targets = await getWorkerTargets(workerId);
  const visits = await db
    .select()
    .from(siteVisits)
    .where(
      and(
        eq(siteVisits.workerId, workerId),
        gte(siteVisits.visitDate, startDate),
        lte(siteVisits.visitDate, endDate)
      )
    );

  const visitCount = visits.length;
  const kmTotal = visits.reduce((s, v) => s + (v.kmCovered ?? 0), 0);

  const visitTarget = targets.dailyVisitTarget * workingDays;
  const kmTarget = targets.dailyKmTarget * workingDays;

  const visitPct = visitTarget > 0 ? Math.min(visitCount / visitTarget, 1) : 0;
  const kmPct = kmTarget > 0 ? Math.min(kmTotal / kmTarget, 1) : 0;

  const worstPct = Math.min(visitPct, kmPct);
  const flag: FlagStatus =
    worstPct >= 0.9 ? "green" : worstPct >= 0.65 ? "amber" : "red";

  return {
    visits: visitCount,
    visitTarget,
    visitPct,
    km: kmTotal,
    kmTarget,
    kmPct,
    flag,
  };
}

export function workingDaysInWeek(ref: Date = new Date()) {
  const start = startOfWeek(ref, { weekStartsOn: 1 });
  const end = endOfWeek(ref, { weekStartsOn: 1 });
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function workingDaysInMonth(ref: Date = new Date()) {
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function getAllWorkersKPI(): Promise<WorkerKPI[]> {
  const allWorkers = await db
    .select()
    .from(users)
    .where(eq(users.role, "worker"));

  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const wdWeek = workingDaysInWeek(now);
  const wdMonth = workingDaysInMonth(now);

  return Promise.all(
    allWorkers.map(async (w) => {
      const dayKPI = await getWorkerDayKPI(w.id, today);
      const weekKPI = await getWorkerPeriodKPI(w.id, weekStart, weekEnd, wdWeek);
      const monthKPI = await getWorkerPeriodKPI(w.id, monthStart, monthEnd, wdMonth);

      const flags = [dayKPI.visitFlag, dayKPI.kmFlag, weekKPI.flag, monthKPI.flag];
      const overallFlag: FlagStatus = flags.includes("red")
        ? "red"
        : flags.includes("amber")
        ? "amber"
        : "green";

      return {
        workerId: w.id,
        workerName: w.name,
        email: w.email,
        today: dayKPI,
        week: weekKPI,
        month: monthKPI,
        overallFlag,
      };
    })
  );
}
