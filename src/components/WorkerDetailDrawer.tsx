import { useMemo } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import type { Worker } from "@/lib/types";
import { Mail, Target, MapPin, Route, ClipboardCheck, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
}

/**
 * Drawer component showing worker profile with KPI summary
 * computed from store visits data, recent visits list, and action buttons.
 */
export function WorkerDetailDrawer({
  open,
  onOpenChange,
  worker,
}: WorkerDetailDrawerProps) {
  const { visits, sites } = useApp();
  const { toast } = useToast();

  // Compute KPI summary from visits
  const kpiSummary = useMemo(() => {
    if (!worker) return { totalVisits: 0, totalKm: 0, recentVisits: [] };

    const workerVisits = visits.filter((v) => v.workerId === worker.id);
    const totalVisits = workerVisits.length;
    const totalKm = workerVisits.reduce((sum, v) => sum + v.km, 0);

    // Sort by timestamp descending and take last 5
    const recentVisits = [...workerVisits]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);

    return { totalVisits, totalKm, recentVisits };
  }, [worker, visits]);

  if (!worker) return null;

  const handleSendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: `A reminder has been sent to ${worker.name}.`,
    });
  };

  const handleViewAllVisits = () => {
    onOpenChange(false);
    // Navigate to visit history — will be wired up in Phase 2
    window.location.href = `/worker/history?workerId=${worker.id}`;
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{worker.name}</DrawerTitle>
          <DrawerDescription>{worker.role}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-4">
          {/* Worker info */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Email:</span>
              <span>{worker.email}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Daily KM Target:</span>
              <span>{worker.dailyKmTarget} km</span>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{kpiSummary.totalVisits}</div>
              <div className="text-xs text-muted-foreground">Total Visits</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{kpiSummary.totalKm.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">KM Traveled</div>
            </div>
          </div>

          {/* Recent visits */}
          {kpiSummary.recentVisits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recent Visits</h4>
              <div className="divide-y rounded-lg border">
                {kpiSummary.recentVisits.map((visit) => {
                  const site = sites.find((s) => s.id === visit.siteId);
                  return (
                    <div key={visit.id} className="flex items-center gap-3 px-3 py-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {site?.name ?? "Unknown Site"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(visit.date)} · {visit.km} km
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {visit.inspection.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={handleSendReminder}>
            <Send className="h-4 w-4" />
            Send Reminder
          </Button>
          <Button variant="default" onClick={handleViewAllVisits}>
            <ClipboardCheck className="h-4 w-4" />
            View All Visits
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
