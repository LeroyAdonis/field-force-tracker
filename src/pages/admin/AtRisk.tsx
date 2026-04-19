import { useApp } from "@/lib/store";
import { dailyKpis, rangeKpis, weekProgress, monthProgress } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { KpiRing } from "@/components/KpiRing";
import { AlertTriangle } from "lucide-react";

export default function AtRisk() {
  const { workers, visits, dailyVisitsTarget } = useApp();

  const rows = workers.map(w => {
    const day = dailyKpis(w, visits, dailyVisitsTarget);
    const week = rangeKpis(w, visits, 7, dailyVisitsTarget, weekProgress());
    const month = rangeKpis(w, visits, 30, dailyVisitsTarget, monthProgress());
    return { worker: w, day, week, month };
  });

  const flagged = rows.filter(r => r.day.status !== "on-track" || r.week.status !== "on-track" || r.month.status !== "on-track");

  return (
    <div className="space-y-6">
      <div>
        <div className="label-eyebrow">Intervention Required</div>
        <h1 className="text-3xl lg:text-4xl font-extrabold mt-1 flex items-center gap-3">
          <AlertTriangle className="h-7 w-7 text-warning" /> At-Risk Workers
        </h1>
        <p className="text-foreground-muted text-sm mt-1">Workers below expected pace across daily, weekly, or monthly cadence.</p>
      </div>

      {flagged.length === 0 && (
        <div className="surface-card p-12 text-center">
          <div className="text-foreground-muted">All workers are tracking on pace. ✓</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {flagged.map(({ worker, day, week, month }) => {
          const worst =
            day.status === "missing" || week.status === "missing" || month.status === "missing" ? "danger" :
            day.status === "at-risk" || week.status === "at-risk" || month.status === "at-risk" ? "warning" : "success";
          return (
            <div key={worker.id} className="surface-card p-6">
              <div className="flex items-start gap-4">
                <img src={worker.avatar} className="h-14 w-14 rounded-2xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{worker.name}</div>
                  <div className="text-xs text-foreground-muted">{worker.role}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusChip status={day.status} />
                    <span className="chip chip-neutral">Today</span>
                  </div>
                </div>
                <KpiRing
                  size={84} stroke={9}
                  value={Math.min(day.visitsPct, day.kmPct)}
                  status={worst as any}
                  centerTop={`${Math.round(Math.min(day.visitsPct, day.kmPct) * 100)}%`}
                  centerBottom="PACE"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <PeriodBox label="Daily" k={day} />
                <PeriodBox label="Weekly" k={week} />
                <PeriodBox label="Monthly" k={month} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PeriodBox({ label, k }: { label: string; k: { visits: number; visitsTarget: number; km: number; kmTarget: number; status: any } }) {
  const cls = k.status === "missing" ? "border-danger/40" : k.status === "at-risk" ? "border-warning/40" : "border-success/30";
  return (
    <div className={`surface-recessed p-3 border-2 ${cls}`}>
      <div className="label-eyebrow text-[10px]">{label}</div>
      <div className="text-sm font-bold mt-1 tabular-nums">{k.visits}/{k.visitsTarget}</div>
      <div className="text-[11px] text-foreground-muted tabular-nums">{k.km}/{k.kmTarget} km</div>
    </div>
  );
}
