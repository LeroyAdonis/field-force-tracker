import { useApp } from "@/lib/store";
import { dailyKpis, statusColor, statusLabel } from "@/lib/kpi";
import { KpiRing } from "@/components/KpiRing";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Plus, TrendingUp, Activity, Cloud } from "lucide-react";
import { todayISO } from "@/lib/mock-data";

export default function WorkerDashboard() {
  const { user, visits, workers, sites, dailyVisitsTarget } = useApp();
  if (!user || user.role !== "worker") return null;
  const me = workers.find(w => w.id === user.id)!;
  const kpi = dailyKpis(me, visits, dailyVisitsTarget);
  const myToday = visits
    .filter(v => v.workerId === me.id && v.date === todayISO)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const recent = myToday.slice(0, 3);

  const greet = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="label-eyebrow">{greet}, {me.name.split(" ")[0]}</div>
        <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">Field Performance</h1>
        <div className="mt-3 inline-flex items-center gap-2 chip chip-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
          ACTIVE SHIFT · {String(new Date().getHours()).padStart(2, "0")}:{String(new Date().getMinutes()).padStart(2, "0")}
        </div>
      </div>

      {/* KPI rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="surface-card p-6 flex items-center gap-6">
          <KpiRing
            value={kpi.visitsPct}
            status={statusColor(kpi.status) as any}
            centerTop={`${kpi.visits}/${kpi.visitsTarget}`}
            centerBottom="VISITS"
            size={150}
          />
          <div>
            <div className="label-eyebrow">Today's Site Visits</div>
            <div className="mt-1 text-2xl font-extrabold">{Math.round(kpi.visitsPct * 100)}%</div>
            <StatusChip status={kpi.status} className="mt-3" />
          </div>
        </div>
        <div className="surface-card p-6 flex items-center gap-6">
          <KpiRing
            value={kpi.kmPct}
            status={statusColor(kpi.status) as any}
            centerTop={`${kpi.km}`}
            centerBottom="KM TODAY"
            size={150}
          />
          <div>
            <div className="label-eyebrow">Distance Covered</div>
            <div className="mt-1 text-2xl font-extrabold">{Math.round(kpi.kmPct * 100)}%</div>
            <div className="mt-3 text-xs text-foreground-muted flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-accent" /> Synced · {kpi.kmTarget} km target
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA - dark */}
      <Link to="/worker/log" className="block">
        <div className="surface-dark p-6 lg:p-8 flex items-center gap-5 group cursor-pointer hover:scale-[1.005] transition-transform">
          <div className="h-14 w-14 rounded-2xl bg-primary-foreground/10 grid place-items-center backdrop-blur-sm">
            <Plus className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">Log Site Visit</div>
            <div className="text-sm text-primary-foreground/70 mt-0.5">Record location, mileage & inspection</div>
          </div>
          <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Recent activity */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="label-eyebrow">Recent Activity</div>
            <h2 className="text-lg font-bold mt-0.5">Today's Log</h2>
          </div>
          <Link to="/worker/history" className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">View History</Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-sm text-foreground-muted py-8 text-center">
            No visits logged yet today. Start your shift by logging your first site visit.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map(v => {
              const site = sites.find(s => s.id === v.siteId);
              const t = new Date(v.timestamp);
              return (
                <div key={v.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-low">
                  <div className="h-10 w-10 rounded-lg bg-surface-high grid place-items-center shrink-0">
                    <MapPin className="h-4 w-4 text-foreground-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{site?.name}</div>
                      <div className="text-xs text-foreground-muted tabular-nums">
                        {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="text-xs text-foreground-muted mt-0.5">{v.inspection.type} · {v.km} km</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-recessed p-5">
          <div className="flex items-center gap-2 label-eyebrow"><TrendingUp className="h-3.5 w-3.5" />Week to Date</div>
          <div className="display-num text-3xl mt-2">
            {visits.filter(v => v.workerId === me.id && (Date.now() - +new Date(v.timestamp)) < 7 * 86400000).length}
          </div>
          <div className="text-xs text-foreground-muted mt-1">visits logged this week</div>
        </div>
        <div className="surface-recessed p-5">
          <div className="flex items-center gap-2 label-eyebrow"><Activity className="h-3.5 w-3.5" />Month to Date</div>
          <div className="display-num text-3xl mt-2">
            {visits.filter(v => v.workerId === me.id && (Date.now() - +new Date(v.timestamp)) < 30 * 86400000).reduce((s, v) => s + v.km, 0).toFixed(0)}
          </div>
          <div className="text-xs text-foreground-muted mt-1">kilometers covered</div>
        </div>
      </div>
    </div>
  );
}
