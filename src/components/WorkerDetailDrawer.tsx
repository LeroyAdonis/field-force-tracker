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
import { useVisits } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";
import type { Worker } from "@/lib/types";
import { Mail, Target, MapPin, ClipboardCheck, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkerDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker | null;
}

export function WorkerDetailDrawer({ open, onOpenChange, worker }: WorkerDetailDrawerProps) {
  const { data: visitsData = [] } = useVisits();
  const { data: sitesData = [] } = useSites();
  const { toast } = useToast();

  const kpiSummary = useMemo(() => {
    if (!worker) return { totalVisits: 0, totalKm: 0, recentVisits: [] };
    const workerVisits = visitsData.filter((v) => v.workerId === worker.id);
    const totalVisits = workerVisits.length;
    const totalKm = workerVisits.reduce(
      (sum, v) => sum + (typeof v.km === "string" ? parseFloat(v.km) : (v.km ?? 0)),
      0
    );
    const recentVisits = [...workerVisits]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 5);
    return { totalVisits, totalKm, recentVisits };
  }, [worker, visitsData]);

  if (!worker) return null;

  const handleSendReminder = () => {
    toast({ title: "Reminder Sent", description: `A reminder has been sent to ${worker.name}.` });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{worker.name}</DrawerTitle>
          <DrawerDescription>{worker.role}</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-4">
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

          {kpiSummary.recentVisits.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recent Visits</h4>
              <div className="divide-y rounded-lg border">
                {kpiSummary.recentVisits.map((v) => {
                  const site = sitesData.find((s) => s.id === v.siteId);
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-3 py-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {site?.name ?? v.siteName ?? "Unknown Site"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.date} · {v.km} km
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {v.inspection?.type ?? "—"}
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
          <Button variant="default" onClick={() => { onOpenChange(false); window.location.href = `/worker/history?workerId=${worker.id}`; }}>
            <ClipboardCheck className="h-4 w-4" />
            View All Visits
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
