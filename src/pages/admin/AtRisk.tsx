import { useState, useMemo } from "react";
import { useWorkers } from "@/hooks/useWorkers";
import { useVisits } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";
import { toWorker, toVisit, toSite } from "@/lib/adapters";
import { DEFAULT_DAILY_VISITS } from "@/lib/mock-data";
import { dailyKpis, rangeKpis, weekProgress, monthProgress } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { KpiRing } from "@/components/KpiRing";
import { WorkerDetailDrawer } from "@/components/WorkerDetailDrawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle, Send, ArrowRightLeft, User, AlertOctagon, ChevronDown,
  TrendingUp, TrendingDown, Minus, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { Worker } from "@/lib/types";

export default function AtRisk() {
  const { data: workersData = [] } = useWorkers();
  const { data: visitsData = [] } = useVisits();
  const { data: sitesData = [] } = useSites();

  const workers = workersData.map(toWorker);
  const visits = visitsData.map(toVisit);
  const sites = sitesData.map(toSite);
  const dailyVisitsTarget = DEFAULT_DAILY_VISITS;

  const [escalatedIds, setEscalatedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignWorker, setReassignWorker] = useState<Worker | null>(null);

  const rows = workers.map((w) => {
    const day = dailyKpis(w, visits, dailyVisitsTarget);
    const week = rangeKpis(w, visits, 7, dailyVisitsTarget, weekProgress());
    const month = rangeKpis(w, visits, 30, dailyVisitsTarget, monthProgress());
    return { worker: w, day, week, month };
  });

  const flagged = rows.filter(
    (r) => r.day.status !== "on-track" || r.week.status !== "on-track" || r.month.status !== "on-track"
  );

  const reassignSites = useMemo(() => {
    if (!reassignWorker) return [];
    const siteIds = new Set(visits.filter((v) => v.workerId === reassignWorker.id).map((v) => v.siteId));
    return sites.filter((s) => siteIds.has(s.id));
  }, [reassignWorker, visits, sites]);

  const handleSendReminder = (worker: Worker) => toast.success(`Reminder sent to ${worker.name} (demo)`);
  const handleReassignSites = (worker: Worker) => { setReassignWorker(worker); setReassignOpen(true); };
  const handleViewProfile = (worker: Worker) => { setSelectedWorker(worker); setDrawerOpen(true); };
  const handleEscalate = (workerId: string) => {
    setEscalatedIds((prev) => { const n = new Set(prev); n.add(workerId); return n; });
    toast.success("Escalated to management (demo)");
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
          <div className="h-12 w-12 rounded-2xl bg-success/10 grid place-items-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-lg font-bold">All Workers on Track</h2>
          <p className="text-sm text-foreground-muted mt-1 max-w-sm mx-auto">No workers are currently flagged for intervention. Keep it up!</p>
        </div>
      )}

      <div className="space-y-3">
        {flagged.map(({ worker, day, week, month }) => {
          const isEscalated = escalatedIds.has(worker.id);
          const worstStatus = [day.status, week.status, month.status].includes("missing") ? "missing"
            : [day.status, week.status, month.status].includes("at-risk") ? "at-risk" : "on-track";

          return (
            <Collapsible key={worker.id}>
              <div className="surface-card p-4">
                <div className="flex items-start gap-4">
                  <img src={worker.avatar} className="h-12 w-12 rounded-full object-cover shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{worker.name}</span>
                      <StatusChip status={worstStatus} />
                      {isEscalated && (
                        <span className="chip chip-danger text-[10px]"><AlertOctagon className="h-3 w-3" /> Escalated</span>
                      )}
                    </div>
                    <div className="text-sm text-foreground-muted">{worker.role}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleViewProfile(worker)} className="gap-1.5">
                      <User className="h-3.5 w-3.5" /> Profile
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        Details <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Today", kpi: day },
                        { label: "This Week", kpi: week },
                        { label: "This Month", kpi: month },
                      ].map(({ label, kpi }) => (
                        <div key={label} className="surface-recessed p-3 rounded-xl text-center">
                          <div className="text-xs font-semibold text-foreground-muted mb-2">{label}</div>
                          <KpiRing
                            value={kpi.visitsPct}
                            status={kpi.status === "on-track" ? "success" : kpi.status === "at-risk" ? "warning" : "danger"}
                            centerTop={`${kpi.visits}`}
                            centerBottom="visits"
                            size={80}
                          />
                          <StatusChip status={kpi.status} className="mt-2 text-[10px]" />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleSendReminder(worker)} className="gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Send Reminder
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleReassignSites(worker)} className="gap-1.5">
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Reassign Sites
                      </Button>
                      {!isEscalated && (
                        <Button variant="destructive" size="sm" onClick={() => handleEscalate(worker.id)} className="gap-1.5">
                          <AlertOctagon className="h-3.5 w-3.5" /> Escalate
                        </Button>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      <WorkerDetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} worker={selectedWorker} />

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Sites — {reassignWorker?.name}</DialogTitle>
            <DialogDescription>Sites this worker has visited recently. Select sites to reassign to another operative.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reassignSites.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">No sites to reassign.</p>
            ) : (
              reassignSites.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-low">
                  <MapPin className="h-4 w-4 text-foreground-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-foreground-muted">{s.zone}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>Close</Button>
            <Button onClick={() => { toast.success("Sites reassigned (demo)"); setReassignOpen(false); }}>
              Confirm Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
