import { RiskStatus, Visit, Worker } from "./types";
import { todayISO } from "./mock-data";

/** Expected proportional progress through current day (0..1) using 7am-7pm shift. */
export function dayProgress(date = new Date()): number {
  const start = 7 * 60; // 7:00
  const end = 19 * 60;  // 19:00
  const m = date.getHours() * 60 + date.getMinutes();
  if (m <= start) return 0.05;
  if (m >= end) return 1;
  return (m - start) / (end - start);
}

export function weekProgress(date = new Date()): number {
  // Mon..Fri working week proportional position
  const day = date.getDay() === 0 ? 7 : date.getDay(); // 1..7
  const today = dayProgress(date);
  const elapsedDays = Math.min(day - 1, 5);
  return Math.min(1, (elapsedDays + today) / 5);
}

export function monthProgress(date = new Date()): number {
  const day = date.getDate();
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.min(1, (day - 1 + dayProgress(date)) / daysInMonth);
}

export interface KpiSnapshot {
  visits: number;
  km: number;
  visitsTarget: number;
  kmTarget: number;
  visitsPct: number; // 0..1+
  kmPct: number;
  expected: number;  // 0..1
  status: RiskStatus;
}

export function statusFor(actualPct: number, expected: number): RiskStatus {
  // Below 70% of expected pace = missing; below 90% = at-risk; else on-track
  if (actualPct < expected * 0.7) return "missing";
  if (actualPct < expected * 0.9) return "at-risk";
  return "on-track";
}

export function statusColor(s: RiskStatus): string {
  return s === "on-track" ? "success" : s === "at-risk" ? "warning" : "danger";
}

export function statusLabel(s: RiskStatus): string {
  return s === "on-track" ? "On Track" : s === "at-risk" ? "At Risk" : "Missing Target";
}

export function dailyKpis(worker: Worker, allVisits: Visit[], dailyVisitsTarget: number): KpiSnapshot {
  const dayVisits = allVisits.filter(v => v.workerId === worker.id && v.date === todayISO);
  const visits = dayVisits.length;
  const km = +dayVisits.reduce((s, v) => s + v.km, 0).toFixed(1);
  const visitsTarget = dailyVisitsTarget;
  const kmTarget = worker.dailyKmTarget;
  const visitsPct = visits / visitsTarget;
  const kmPct = km / kmTarget;
  const expected = dayProgress();
  // Worst of the two metrics drives status
  const worst = Math.min(visitsPct, kmPct);
  return { visits, km, visitsTarget, kmTarget, visitsPct, kmPct, expected, status: statusFor(worst, expected) };
}

export function rangeKpis(
  worker: Worker,
  allVisits: Visit[],
  days: number,
  dailyVisitsTarget: number,
  expected: number
): KpiSnapshot {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  const filtered = allVisits.filter(v => v.workerId === worker.id && new Date(v.timestamp) >= cutoff);
  const visits = filtered.length;
  const km = +filtered.reduce((s, v) => s + v.km, 0).toFixed(1);
  const visitsTarget = dailyVisitsTarget * days;
  const kmTarget = worker.dailyKmTarget * days;
  const visitsPct = visits / visitsTarget;
  const kmPct = km / kmTarget;
  const worst = Math.min(visitsPct, kmPct);
  return { visits, km, visitsTarget, kmTarget, visitsPct, kmPct, expected, status: statusFor(worst, expected) };
}
