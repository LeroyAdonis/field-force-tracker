import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/store";
import { useVisits, type VisitData } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";
import { toVisit } from "@/lib/adapters";
import { DEFAULT_DAILY_VISITS } from "@/lib/mock-data";
import { dailyKpis, statusColor } from "@/lib/kpi";
import { KpiRing } from "@/components/KpiRing";
import { StatusChip } from "@/components/StatusChip";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Plus, TrendingUp, Activity, Cloud, RefreshCw } from "lucide-react";
import { VisitDetailDrawer } from "@/components/VisitDetailDrawer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Worker } from "@/lib/types";

export default function WorkerDashboard() {
  const { user } = useApp();
  const { data: visitsData = [], refetch } = useVisits();
  const { data: sitesData = [] } = useSites();

  const [selectedVisit, setSelectedVisit] = useState<VisitData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const handleRefresh = useCallback(() => {
    refetch();
    const now = new Date();
    setLastUpdated(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }, [refetch]);

  useEffect(() => {
    const interval = setInterval(handleRefresh, 60_000);
    return () => clearInterval(interval);
  }, [handleRefresh]);

  if (!user || user.role !== "worker") return null;

  const todayISO = new Date().toISOString().slice(0, 10);

  // Build a minimal Worker object from session data for KPI computation
  const me: Worker = {
    id: user.workerId ?? user.id,
    name: user.name,
    email: user.email,
    role: user.title,
    avatar: user.avatar,
    dailyKmTarget: user.dailyKmTarget ?? 60,
    active: true,
  };

  const visits = visitsData.map(toVisit);
  const kpi = dailyKpis(me, visits, DEFAULT_DAILY_VISITS);

  const myToday = visitsData
    .filter((v) => v.workerId === me.id && v.date === todayISO)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  const recent = myToday.slice(0, 3);

  const greet = new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening";

  const weekKm = visits
    .filter((v) => v.workerId === me.id && Date.now() - +new Date(v.timestamp) < 7 * 86400000)
    .reduce((s, v) => s + v.km, 0)
    .toFixed(0);

  const monthVisits = visits
    .filter((v) => v.workerId === me.id && Date.now() - +new Date(v.timestamp) < 30 * 86400000)
    .length;

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="surface-card p-6 flex items-center gap-6 cursor-pointer">
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
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Visits completed today ({kpi.visits}) out of daily target ({kpi.visitsTarget}). {Math.round(kpi.visitsPct * 100)}% achieved.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="surface-card p-6 flex items-center gap-6 cursor-pointer">
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
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <p>Kilometers traveled today ({kpi.km} km) out of daily target ({kpi.kmTarget} km). {Math.round(kpi.kmPct * 100)}% achieved.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center justify-between text-xs text-foreground-muted">
        <span>Last updated: {lastUpdated}</span>
        <Button type="button" variant="ghost" size="sm" onClick={handleRefresh} className="h-7 gap-1.5 text-xs text-foreground-muted hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

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
            {recent.map((v) => {
              const site = sitesData.find((s) => s.id === v.siteId);
              const t = new Date(v.timestamp);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setSelectedVisit(v); setDrawerOpen(true); }}
                  className="w-full flex items-start gap-3 p-3 rounded-xl bg-surface-low hover:bg-surface-high transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-surface-high grid place-items-center shrink-0">
                    <MapPin className="h-4 w-4 text-foreground-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{site?.name ?? v.siteName}</div>
                      <div className="text-xs text-foreground-muted tabular-nums">
                        {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="text-xs text-foreground-muted mt-0.5">{v.inspection?.type} · {v.km} km</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="surface-recessed p-5">
          <div className="flex items-center gap-2 label-eyebrow"><TrendingUp className="h-3.5 w-3.5" />Week to Date</div>
          <div className="display-num text-3xl mt-2">{monthVisits}</div>
          <div className="text-xs text-foreground-muted mt-1">visits logged this week</div>
        </div>
        <div className="surface-recessed p-5">
          <div className="flex items-center gap-2 label-eyebrow"><Activity className="h-3.5 w-3.5" />Month to Date</div>
          <div className="display-num text-3xl mt-2">{weekKm}</div>
          <div className="text-xs text-foreground-muted mt-1">kilometers covered</div>
        </div>
      </div>

      <VisitDetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} visit={selectedVisit} />
    </div>
  );
}
