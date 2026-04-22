import { useWorkers, useUpdateWorker } from "@/hooks/useWorkers";
import { toWorker } from "@/lib/adapters";
import { DEFAULT_DAILY_VISITS, DEFAULT_DAILY_KM } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

const KM_MIN = 10;
const KM_MAX = 200;

export default function Settings() {
  const { data: workersData = [] } = useWorkers();
  const { mutate: updateWorker, isPending } = useUpdateWorker();

  const workers = workersData.map(toWorker);

  const [localTargets, setLocalTargets] = useState<Record<string, number>>({});
  const [savedWorkers, setSavedWorkers] = useState<Record<string, boolean>>({});
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setLocalTargets((prev) => {
      const m: Record<string, number> = {};
      workers.forEach((w) => { m[w.id] = prev[w.id] ?? w.dailyKmTarget; });
      return m;
    });
  }, [workersData]);

  const isValidKm = (val: number) => val >= KM_MIN && val <= KM_MAX;

  const handleSaveWorker = useCallback((workerId: string) => {
    const val = localTargets[workerId];
    if (val === undefined || !isValidKm(val)) return;
    updateWorker({ id: workerId, updates: { dailyKmTarget: val } }, {
      onSuccess: () => {
        setSavedWorkers((prev) => ({ ...prev, [workerId]: true }));
        toast.success("KM target saved");
        setTimeout(() => setSavedWorkers((prev) => ({ ...prev, [workerId]: false })), 2000);
      },
      onError: () => toast.error("Failed to save KM target"),
    });
  }, [localTargets, updateWorker]);

  const handleResetDefaults = useCallback(() => {
    workers.forEach((w) => {
      updateWorker({ id: w.id, updates: { dailyKmTarget: DEFAULT_DAILY_KM } });
    });
    const m: Record<string, number> = {};
    workers.forEach((w) => { m[w.id] = DEFAULT_DAILY_KM; });
    setLocalTargets(m);
    setResetOpen(false);
    toast.success("All targets reset to defaults");
  }, [workers, updateWorker]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="label-eyebrow">Configuration</div>
        <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">System Settings</h1>
        <p className="text-foreground-muted text-sm mt-1">Configure global KPI targets and per-worker overrides.</p>
      </div>

      <div className="surface-card p-6">
        <h2 className="text-lg font-bold">Global Targets</h2>
        <p className="text-sm text-foreground-muted mt-1">Applied to all workers unless overridden.</p>
        <div className="mt-5">
          <label className="text-xs font-semibold text-foreground-muted">Daily Site Visits Target</label>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-32 h-11 px-4 rounded-xl bg-surface-low flex items-center font-bold tabular-nums text-sm">
              {DEFAULT_DAILY_VISITS}
            </div>
            <span className="text-xs text-foreground-muted">visits / day (system default)</span>
          </div>
          <p className="text-xs text-foreground-muted mt-2">Per-worker visit targets can be configured in a future release.</p>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Per-Worker KM Targets</h2>
            <p className="text-sm text-foreground-muted mt-1">Configurable distance target per operative.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>
        </div>
        <div className="mt-5 space-y-2">
          {workers.length === 0 && (
            <p className="text-sm text-foreground-muted py-4 text-center">No workers found.</p>
          )}
          {workers.map((w) => {
            const localVal = localTargets[w.id] ?? w.dailyKmTarget;
            const dirty = localVal !== w.dailyKmTarget;
            const valid = isValidKm(localVal);
            const saved = savedWorkers[w.id];

            return (
              <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl bg-surface-low/50 ${dirty && valid ? "ring-1 ring-primary/40" : ""}`}>
                <img src={w.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{w.name}</div>
                  <div className="text-xs text-foreground-muted truncate">{w.role}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={KM_MIN}
                      max={KM_MAX}
                      value={localVal}
                      onChange={(e) => setLocalTargets((prev) => ({ ...prev, [w.id]: +e.target.value || 0 }))}
                      className={`w-24 h-10 px-3 rounded-lg bg-surface-lowest outline-none text-sm font-bold tabular-nums text-right ${!valid ? "ring-1 ring-destructive" : ""}`}
                    />
                    <span className="text-xs text-foreground-muted w-8">km</span>
                    <Button variant="primary" size="sm" disabled={!dirty || !valid || isPending} onClick={() => handleSaveWorker(w.id)}>
                      Save
                    </Button>
                  </div>
                  {!valid && <span className="text-xs text-destructive">Must be {KM_MIN}–{KM_MAX} km</span>}
                  {dirty && valid && !saved && <span className="text-xs text-primary font-medium">Unsaved</span>}
                  {saved && <span className="text-xs text-emerald-500 font-medium">Saved ✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmActionDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset to Defaults"
        description="This will reset all KM targets to their default values. Continue?"
        confirmLabel="Reset"
        onConfirm={handleResetDefaults}
      />
    </div>
  );
}
