import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { dailyKpis, rangeKpis, weekProgress, monthProgress } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { KpiRing } from "@/components/KpiRing";
import { WorkerDetailDrawer } from "@/components/WorkerDetailDrawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Send,
  ArrowRightLeft,
  User,
  AlertOctagon,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { Worker } from "@/lib/types";

export default function AtRisk() {
  const { workers, visits, sites, dailyVisitsTarget } = useApp();

  // Track escalated workers by ID
  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());

  // Worker detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  // Reassign dialog state
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignWorker, setReassignWorker] = useState<Worker | null>(null);

  const rows = workers.map(w => {
    const day = dailyKpis(w, visits, dailyVisitsTarget);
    const week = rangeKpis(w, visits, 7, dailyVisitsTarget, weekProgress());
    const month = rangeKpis(w, visits, 30, dailyVisitsTarget, monthProgress());
    return { worker: w, day, week, month };
  });

  const flagged = rows.filter(r => r.day.status !== "on-track" || r.week.status !== "on-track" || r.month.status !== "on-track");

  // Get worker's sites for reassign dialog
  const reassignSites = useMemo(() => {
    if (!reassignWorker) return [];
    const siteIds = new Set(
      visits
        .filter(v => v.workerId === reassignWorker.id)
        .map(v => v.siteId)
    );
    return sites.filter(s => siteIds.has(s.id));
  }, [reassignWorker, visits, sites]);

  const handleSendReminder = (worker: Worker) => {
    toast.success(`Reminder sent to ${worker.name} (demo)`);
  };

  const handleReassignSites = (worker: Worker) => {
    setReassignWorker(worker);
    setReassignOpen(true);
  };

  const handleViewProfile = (worker: Worker) => {
    setSelectedWorker(worker);
    setDrawerOpen(true);
  };

  const handleEscalate = (workerId: string, workerName: string) => {
    setEscalatedIds(prev => {
      const next = new Set(prev);
      next.add(workerId);
      return next;
    });
    toast.success(`Escalated to management (demo)`);
  };

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
          const isEscalated = escalatedIds.has(worker.id);

          // Trend indicator: compare weekly completion rate vs daily
          const dailyPct = Math.min(day.visitsPct, day.kmPct);
          const weeklyPct = Math.min(week.visitsPct, week.kmPct);
          const trend: "up" | "down" | "stable" =
            weeklyPct > dailyPct * 1.05 ? "up" :
            weeklyPct < dailyPct * 0.95 ? "down" : "stable";

          // Worker's recent visits (last 5)
          const workerVisits = [...visits]
            .filter(v => v.workerId === worker.id)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .slice(0, 5);

          // Worker's recent sites
          const workerSiteIds = new Set(workerVisits.map(v => v.siteId));
          const workerSites = sites.filter(s => workerSiteIds.has(s.id));

          return (
            <Collapsible key={worker.id}>
              <div className="surface-card p-6">
                {/* Basic info — always visible */}
                <div className="flex items-start gap-4">
                  <img src={worker.avatar} className="h-14 w-14 rounded-2xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold flex items-center gap-2">
                      {worker.name}
                      {isEscalated && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-danger/15 text-danger">
                          <AlertOctagon className="h-3 w-3" /> Escalated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground-muted">{worker.role}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusChip status={day.status} />
                      <span className="chip chip-neutral">Today</span>
                    </div>
                  </div>
                  <KpiRing
                    size={84}
                    stroke={9}
                    value={Math.min(day.visitsPct, day.kmPct)}
                    status={worst as any}
                    centerTop={`${Math.round(Math.min(day.visitsPct, day.kmPct) * 100)}%`}
                    centerBottom="PACE"
                  />
                </div>

                {/* Period boxes with collapsible detail */}
                <div className="grid grid-cols-3 gap-2 mt-5">
                  <CollapsiblePeriodBox label="Daily" k={day} />
                  <CollapsiblePeriodBox label="Weekly" k={week} />
                  <CollapsiblePeriodBox label="Monthly" k={month} />
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendReminder(worker)}
                  >
                    <Send className="h-3.5 w-3.5" /> Send Reminder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReassignSites(worker)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Reassign Sites
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProfile(worker)}
                  >
                    <User className="h-3.5 w-3.5" /> View Full Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEscalate(worker.id, worker.name)}
                    disabled={isEscalated}
                  >
                    <AlertOctagon className="h-3.5 w-3.5" /> {isEscalated ? "Escalated" : "Escalate"}
                  </Button>
                </div>

                {/* Expand toggle */}
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors w-full justify-center">
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    Show details
                  </button>
                </CollapsibleTrigger>

                {/* Expanded details */}
                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
                    {/* Trend indicator */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground-muted font-medium">Trend:</span>
                      {trend === "up" && (
                        <span className="inline-flex items-center gap-1 text-success font-semibold">
                          <TrendingUp className="h-4 w-4" /> Improving
                        </span>
                      )}
                      {trend === "down" && (
                        <span className="inline-flex items-center gap-1 text-danger font-semibold">
                          <TrendingDown className="h-4 w-4" /> Declining
                        </span>
                      )}
                      {trend === "stable" && (
                        <span className="inline-flex items-center gap-1 text-foreground-muted font-semibold">
                          <Minus className="h-4 w-4" /> Stable
                        </span>
                      )}
                    </div>

                    {/* Recent visits (last 5) */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">Recent Visits</h4>
                      {workerVisits.length === 0 ? (
                        <p className="text-xs text-foreground-muted">No visits recorded.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {workerVisits.map(v => {
                            const site = sites.find(s => s.id === v.siteId);
                            return (
                              <div key={v.id} className="flex items-center gap-2 text-xs">
                                <MapPin className="h-3 w-3 text-foreground-muted shrink-0" />
                                <span className="font-medium truncate">{site?.name ?? "Unknown Site"}</span>
                                <span className="text-foreground-muted ml-auto shrink-0">{v.date}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Recent sites */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">Recent Sites</h4>
                      {workerSites.length === 0 ? (
                        <p className="text-xs text-foreground-muted">No sites found.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {workerSites.map(s => (
                            <span key={s.id} className="chip chip-neutral text-[11px]">{s.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Worker Detail Drawer */}
      <WorkerDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        worker={selectedWorker}
      />

      {/* Reassign Sites Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Sites — {reassignWorker?.name}</DialogTitle>
            <DialogDescription>
              Select a site to reassign to another worker. Site reassignment coming soon.
            </DialogDescription>
          </DialogHeader>
          {reassignSites.length === 0 ? (
            <p className="text-sm text-foreground-muted py-4">No sites found for this worker.</p>
          ) : (
            <ul className="divide-y border rounded-lg max-h-60 overflow-y-auto">
              {reassignSites.map(s => (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-foreground-muted text-xs ml-auto">{s.zone}</span>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Site reassignment coming soon");
                setReassignOpen(false);
              }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Period box that is clickable to expand with more detail. */
function CollapsiblePeriodBox({ label, k }: { label: string; k: { visits: number; visitsTarget: number; km: number; kmTarget: number; status: any; visitsPct: number; kmPct: number } }) {
  const cls = k.status === "missing" ? "border-danger/40" : k.status === "at-risk" ? "border-warning/40" : "border-success/30";
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button className={`surface-recessed p-3 border-2 ${cls} w-full text-left rounded-lg`}>
          <div className="label-eyebrow text-[10px]">{label}</div>
          <div className="text-sm font-bold mt-1 tabular-nums">{k.visits}/{k.visitsTarget}</div>
          <div className="text-[11px] text-foreground-muted tabular-nums">{k.km}/{k.kmTarget} km</div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="surface-recessed p-3 border-2 border-t-0 rounded-b-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-foreground-muted">Visit completion</span>
            <span className="font-semibold tabular-nums">{Math.round(k.visitsPct * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">KM completion</span>
            <span className="font-semibold tabular-nums">{Math.round(k.kmPct * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted">Status</span>
            <span className="font-semibold capitalize">{k.status.replace("-", " ")}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
