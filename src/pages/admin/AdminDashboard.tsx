import { useState, useEffect, useCallback } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { useVisits, type VisitData } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";
import { toWorker, toVisit } from "@/lib/adapters";
import { dailyKpis, dayProgress } from "@/lib/kpi";
import { DEFAULT_DAILY_VISITS } from "@/lib/mock-data";
import { StatusPill } from "@/components/StatusChip";
import { Calendar, MapPin, Users, FileBarChart, UserPlus, Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WorkerDetailDrawer } from "@/components/WorkerDetailDrawer";
import { VisitDetailDrawer } from "@/components/VisitDetailDrawer";
import type { Worker } from "@/lib/types";

export default function AdminDashboard() {
  const { data: workersData = [], refetch: refetchWorkers } = useWorkers();
  const { data: visitsData = [], refetch: refetchVisits } = useVisits();
  const { data: sitesData = [], refetch: refetchSites } = useSites();

  const workers = workersData.map(toWorker);
  const visits = visitsData.map(toVisit);
  const dailyVisitsTarget = DEFAULT_DAILY_VISITS;

  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitData | null>(null);
  const [visitDrawerOpen, setVisitDrawerOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const handleRefresh = useCallback(() => {
    refetchWorkers();
    refetchVisits();
    refetchSites();
    const now = new Date();
    setLastUpdated(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }, [refetchWorkers, refetchVisits, refetchSites]);

  useEffect(() => {
    const interval = setInterval(handleRefresh, 60_000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  const todayISO = new Date().toISOString().slice(0, 10);
  const todayVisits = visits.filter((v) => v.date === todayISO);
  const totalVisitsToday = todayVisits.length;
  const totalKmToday = todayVisits.reduce((s, v) => s + v.km, 0);

  const snapshots = workers.map((w) => ({ worker: w, kpi: dailyKpis(w, visits, dailyVisitsTarget) }));
  const flagged = snapshots.filter((s) => s.kpi.status !== "on-track");
  const highRisk = flagged.filter((s) => s.kpi.status === "missing").length;
  const warning = flagged.filter((s) => s.kpi.status === "at-risk").length;

  const recent = [...visitsData]
    .filter((v) => v.date === todayISO)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 6);

  const efficiency = Math.round(
    (snapshots.reduce((s, x) => s + Math.min(1, x.kpi.visitsPct / Math.max(0.1, x.kpi.expected)), 0) /
      Math.max(1, snapshots.length)) * 100
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="label-eyebrow">Command Center</div>
          <h1 className="text-4xl xl:text-5xl font-extrabold mt-1 leading-[1.05]">Operational Pulse</h1>
          <p className="text-foreground-muted mt-2 max-w-xl">Real-time oversight for site operations, workforce KPIs, and safety protocols.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted tabular-nums">Last updated: {lastUpdated}</span>
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link to="/admin/reports"><FileBarChart className="h-4 w-4" /> View Reports</Link>
          </Button>
          <Button variant="primary" size="lg" asChild>
            <Link to="/admin/workforce"><UserPlus className="h-4 w-4" /> Manage Workers</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={<Calendar className="h-4 w-4" />}
          label="Inspections Today"
          value={totalVisitsToday.toLocaleString()}
          delta={`Target: ${dailyVisitsTarget * Math.max(1, workers.length)}`}
        />
        <MetricCard
          icon={<MapPin className="h-4 w-4" />}
          label="Mileage Today"
          value={totalKmToday.toFixed(0)}
          unit="km"
          delta={`${Math.round(dayProgress() * 100)}% of shift elapsed`}
        />
        <div className="surface-dark p-6">
          <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-lg bg-primary-foreground/10 grid place-items-center">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex -space-x-2">
              {workers.slice(0, 4).map((w) => (
                <img key={w.id} src={w.avatar} className="h-7 w-7 rounded-full border-2 border-[hsl(0_0%_4%)] object-cover" alt={w.name} />
              ))}
            </div>
          </div>
          <div className="label-eyebrow mt-6 text-primary-foreground/60">Active Workers</div>
          <div className="display-num mt-1">{workers.filter((w) => w.active).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 surface-card p-6">
          <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Flagged Workers
              </h2>
              <p className="text-sm text-foreground-muted mt-1">Pace logic flags workers below expected proportional progress.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip chip-danger">{highRisk} High Risk</span>
              <span className="chip chip-warning">{warning} Warning</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-3 px-3 py-2 label-eyebrow text-[10px]">
              <div className="col-span-5">Worker</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Pace</div>
            </div>
            {flagged.length === 0 && (
              <div className="text-sm text-foreground-muted py-10 text-center">All workers tracking on pace.</div>
            )}
            {flagged.map(({ worker, kpi }) => (
              <button
                key={worker.id}
                onClick={() => { setSelectedWorker(worker); setDrawerOpen(true); }}
                className="grid grid-cols-12 gap-3 items-center px-3 py-3 rounded-xl hover:bg-surface-low transition-colors w-full text-left"
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <img src={worker.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{worker.name}</div>
                    <div className="text-xs text-foreground-muted truncate">{kpi.visits}/{kpi.visitsTarget} visits · {kpi.km} km</div>
                  </div>
                </div>
                <div className="col-span-3 text-sm text-foreground-muted truncate">{worker.role}</div>
                <div className="col-span-2"><StatusPill status={kpi.status} /></div>
                <div className="col-span-2 text-right text-sm font-bold tabular-nums">
                  {Math.round(Math.min(kpi.visitsPct, kpi.kmPct) * 100)}%
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-recessed p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-accent" />
              <div className="font-bold text-sm">Real-time Activity</div>
            </div>
            <div className="space-y-3">
              {recent.length === 0 && (
                <div className="text-xs text-foreground-muted py-4 text-center">No activity yet today.</div>
              )}
              {recent.map((v) => {
                const site = sitesData.find((s) => s.id === v.siteId);
                const t = new Date(v.timestamp);
                return (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVisit(v); setVisitDrawerOpen(true); }}
                    className="flex items-start gap-3 w-full text-left hover:bg-surface-low/50 rounded-lg p-1 -m-1 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-success mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-tight">Visit Logged</div>
                      <div className="text-xs text-foreground-muted leading-relaxed mt-0.5">
                        {v.workerName?.split(" ")[0] ?? "Worker"} · {site?.name ?? v.siteName}
                      </div>
                      <div className="text-[11px] text-foreground-muted/70 mt-0.5 tabular-nums">
                        {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")} · {v.km} km
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-dark p-5">
            <div className="label-eyebrow text-primary-foreground/60">Site Efficiency</div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="display-num text-4xl">{efficiency}%</div>
              <span className="chip chip-success !bg-success/20">Optimal</span>
            </div>
            <div className="text-xs text-primary-foreground/60 mt-3 leading-relaxed">
              Workforce average pace vs expected. Live across {workers.length} field operatives.
            </div>
          </div>
        </div>
      </div>

      <WorkerDetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} worker={selectedWorker} />
      <VisitDetailDrawer open={visitDrawerOpen} onOpenChange={setVisitDrawerOpen} visit={selectedVisit} />
    </div>
  );
}

function MetricCard({ icon, label, value, unit, delta }: { icon: React.ReactNode; label: string; value: string; unit?: string; delta?: string }) {
  return (
    <div className="surface-card p-6 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="h-9 w-9 rounded-lg bg-accent/10 grid place-items-center text-accent">{icon}</div>
        {delta && <div className="text-xs font-semibold text-success">{delta}</div>}
      </div>
      <div className="label-eyebrow mt-6">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <div className="display-num">{value}</div>
        {unit && <div className="text-sm font-bold text-foreground-muted">{unit}</div>}
      </div>
    </div>
  );
}
