import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { dailyVisitsTarget, setDailyVisitsTarget, workers, updateWorker } = useApp();
  const [global, setGlobal] = useState(dailyVisitsTarget);

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
            <Button variant="primary" onClick={() => { setDailyVisitsTarget(global); toast.success("Global target updated"); }}>
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h2 className="text-lg font-bold">Per-Worker KM Targets</h2>
        <p className="text-sm text-foreground-muted mt-1">Configurable distance target per operative.</p>
        <div className="mt-5 space-y-2">
          {workers.map(w => (
            <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-low/50">
              <img src={w.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{w.name}</div>
                <div className="text-xs text-foreground-muted truncate">{w.role}</div>
              </div>
              <input
                type="number" min={0} value={w.dailyKmTarget}
                onChange={e => updateWorker(w.id, { dailyKmTarget: +e.target.value || 0 })}
                className="w-24 h-10 px-3 rounded-lg bg-surface-lowest outline-none text-sm font-bold tabular-nums text-right"
              />
              <span className="text-xs text-foreground-muted w-8">km</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
