import { useApp } from "@/lib/store";
import { DEFAULT_DAILY_VISITS, DEFAULT_DAILY_KM } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

const KM_MIN = 10;
const KM_MAX = 200;

export default function Settings() {
  const { dailyVisitsTarget, setDailyVisitsTarget, workers, updateWorker } = useApp();

  // 11.4 — Global target with unsaved changes indicator
  const [global, setGlobal] = useState(dailyVisitsTarget);
  const globalDirty = global !== dailyVisitsTarget;

  // Sync local state when store changes (e.g., after reset)
  useEffect(() => { setGlobal(dailyVisitsTarget); }, [dailyVisitsTarget]);

  // 11.1 — Per-worker local targets (Map of workerId -> local value)
  const [localTargets, setLocalTargets] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    workers.forEach(w => { m[w.id] = w.dailyKmTarget; });
    return m;
  });

  // Track which workers have been "saved" to show "Saved ✓" indicator
  const [savedWorkers, setSavedWorkers] = useState<Record<string, boolean>>({});

  // Sync local targets when workers store changes (e.g., after reset)
  useEffect(() => {
    setLocalTargets(prev => {
      const m: Record<string, number> = {};
      workers.forEach(w => { m[w.id] = prev[w.id] ?? w.dailyKmTarget; });
      return m;
    });
  }, [workers]);

  // 11.2 — Validation helper
  const isValidKm = (val: number) => val >= KM_MIN && val <= KM_MAX;

  // 11.1 — Save handler for a specific worker
  const handleSaveWorker = useCallback((workerId: string) => {
    const val = localTargets[workerId];
    if (val === undefined || !isValidKm(val)) return;
    updateWorker(workerId, { dailyKmTarget: val });
    setSavedWorkers(prev => ({ ...prev, [workerId]: true }));
    toast.success("KM target saved");
    // Clear "Saved ✓" indicator after 2 seconds
    setTimeout(() => {
      setSavedWorkers(prev => ({ ...prev, [workerId]: false }));
    }, 2000);
  }, [localTargets, updateWorker]);

  // 11.3 — Reset to defaults
  const [resetOpen, setResetOpen] = useState(false);
  const handleResetDefaults = useCallback(() => {
    setDailyVisitsTarget(DEFAULT_DAILY_VISITS);
    workers.forEach(w => {
      updateWorker(w.id, { dailyKmTarget: DEFAULT_DAILY_KM });
    });
    // Reset local targets to defaults
    const m: Record<string, number> = {};
    workers.forEach(w => { m[w.id] = DEFAULT_DAILY_KM; });
    setLocalTargets(m);
    setResetOpen(false);
    toast.success("All targets reset to defaults");
  }, [workers, setDailyVisitsTarget, updateWorker]);

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
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="number" min={1} value={global} onChange={e => setGlobal(+e.target.value || 0)}
              className="w-32 h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none text-sm tabular-nums font-bold"
            />
            {/* 11.4 — Disable Save when no unsaved changes */}
            <Button
              variant="primary"
              disabled={!globalDirty}
              onClick={() => { setDailyVisitsTarget(global); toast.success("Global target updated"); }}
            >
              Save
            </Button>
            {/* 11.4 — Unsaved changes indicator */}
            {globalDirty && (
              <span className="text-xs text-primary font-medium animate-pulse">● Unsaved changes</span>
            )}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Per-Worker KM Targets</h2>
            <p className="text-sm text-foreground-muted mt-1">Configurable distance target per operative.</p>
          </div>
          {/* 11.3 — Reset to Defaults button */}
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Defaults
          </Button>
        </div>
        <div className="mt-5 space-y-2">
          {workers.map(w => {
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
                      onChange={e => {
                        const v = +e.target.value || 0;
                        setLocalTargets(prev => ({ ...prev, [w.id]: v }));
                      }}
                      className={`w-24 h-10 px-3 rounded-lg bg-surface-lowest outline-none text-sm font-bold tabular-nums text-right ${!valid ? "ring-1 ring-destructive" : ""}`}
                    />
                    <span className="text-xs text-foreground-muted w-8">km</span>
                    {/* 11.1 — Save button per worker */}
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={!dirty || !valid}
                      onClick={() => handleSaveWorker(w.id)}
                    >
                      Save
                    </Button>
                  </div>
                  {/* 11.2 — Validation error */}
                  {!valid && (
                    <span className="text-xs text-destructive">Daily KM target must be between {KM_MIN} and {KM_MAX}</span>
                  )}
                  {/* 11.1 — Unsaved indicator */}
                  {dirty && valid && !saved && (
                    <span className="text-xs text-primary font-medium">Unsaved</span>
                  )}
                  {/* 11.1 — Saved indicator */}
                  {saved && (
                    <span className="text-xs text-emerald-500 font-medium">Saved ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 11.3 — Reset confirmation dialog */}
      <ConfirmActionDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset to Defaults"
        description="This will reset all targets to their default values. Continue?"
        confirmLabel="Reset"
        onConfirm={handleResetDefaults}
      />
    </div>
  );
}
