import { useApp } from "@/lib/store";
import { dailyKpis, rangeKpis, weekProgress, monthProgress, statusColor, statusLabel } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { useState, useTransition, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useWorkers, useAddWorker, useUpdateWorker, useDeleteWorker, type WorkerData } from "@/hooks/useWorkers";
import { useVisits } from "@/hooks/useVisits";
import type { Worker, Visit } from "@/lib/types";

const avatars = [
  "https://i.pravatar.cc/120?img=22",
  "https://i.pravatar.cc/120?img=44",
  "https://i.pravatar.cc/120?img=56",
  "https://i.pravatar.cc/120?img=68",
];

export default function Workforce() {
  const { dailyVisitsTarget } = useApp();
  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: visits = [] } = useVisits();
  const addWorkerMutation = useAddWorker();
  const updateWorkerMutation = useUpdateWorker();
  const deleteWorkerMutation = useDeleteWorker();

  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });

  const [editWorker, setEditWorker] = useState<WorkerData | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });

  const [removeTarget, setRemoveTarget] = useState<WorkerData | null>(null);

  const [isPending, startTransition] = useTransition();

  const filtered = workers.filter(w =>
    w.displayName.toLowerCase().includes(query.toLowerCase()) || w.jobTitle.toLowerCase().includes(query.toLowerCase())
  );

  // Normalize km to number for KPI computation
  const visitsForKpi = visits.map(v => ({ ...v, km: Number(v.km) })) as unknown as Visit[];

  const computeKpi = (w: WorkerData) => {
    const workerForKpi = { id: w.id, dailyKmTarget: w.dailyKmTarget } as unknown as Worker;
    if (period === "day") return dailyKpis(workerForKpi, visitsForKpi, dailyVisitsTarget);
    if (period === "week") return rangeKpis(workerForKpi, visitsForKpi, 7, dailyVisitsTarget, weekProgress());
    return rangeKpis(workerForKpi, visitsForKpi, 30, dailyVisitsTarget, monthProgress());
  };

  const handlePeriodChange = (p: "day" | "week" | "month") => {
    startTransition(() => {
      setPeriod(p);
    });
  };

  const submit = () => {
    if (!draft.name.trim() || !draft.email.trim()) { toast.error("Name and email required"); return; }
    addWorkerMutation.mutate({
      displayName: draft.name,
      email: draft.email,
      jobTitle: draft.role,
      dailyKmTarget: draft.dailyKmTarget,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      active: true,
      isDemo: false,
    }, {
      onSuccess: () => {
        setDraft({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });
        setShowAdd(false);
        toast.success("Worker added");
      },
      onError: () => toast.error("Failed to add worker"),
    });
  };

  const openEdit = (w: WorkerData) => {
    setEditWorker(w);
    setEditDraft({ name: w.displayName, email: w.email, role: w.jobTitle, dailyKmTarget: w.dailyKmTarget });
  };

  const saveEdit = () => {
    if (!editWorker) return;
    if (!editDraft.name.trim()) { toast.error("Name is required"); return; }
    updateWorkerMutation.mutate({
      id: editWorker.id,
      updates: { displayName: editDraft.name, jobTitle: editDraft.role, dailyKmTarget: editDraft.dailyKmTarget },
    }, {
      onSuccess: () => {
        setEditWorker(null);
        toast.success("Worker updated");
      },
      onError: () => toast.error("Failed to update worker"),
    });
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    deleteWorkerMutation.mutate(removeTarget.id, {
      onSuccess: () => {
        setRemoveTarget(null);
        toast.success("Worker removed");
      },
      onError: () => toast.error("Failed to remove worker"),
    });
  };

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="label-eyebrow">Workforce</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">All Workers</h1>
          <p className="text-foreground-muted text-sm mt-1">KPI rollups across daily, weekly, and monthly cadence.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="surface-recessed p-1 flex relative">
            {(["day", "week", "month"] as const).map(p => (
              <button key={p} onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  period === p ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground-muted"
                }`}>
                {p}
              </button>
            ))}
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-recessed/60 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
          <Button onClick={() => setShowAdd(true)} variant="primary"><Plus className="h-4 w-4" /> Add Worker</Button>
        </div>
      </div>

      <div className="surface-card p-4 lg:p-6">
        <div className="max-w-sm mb-4">
          <DebouncedSearchInput
            onValueChange={handleSearchChange}
            placeholder="Search workers..."
            debounceMs={300}
          />
        </div>

        {workersLoading ? (
          <div className="py-12 text-center text-foreground-muted text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading workers…
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 lg:mx-0">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="label-eyebrow text-[10px]">
                  <th className="text-left px-4 py-3">Worker</th>
                  <th className="text-left px-2 py-3">Role</th>
                  <th className="text-right px-2 py-3">Visits</th>
                  <th className="text-right px-2 py-3">KM</th>
                  <th className="text-right px-2 py-3">Pace</th>
                  <th className="text-left px-2 py-3">Status</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w, i) => {
                  const k = computeKpi(w);
                  const pace = Math.round(Math.min(k.visitsPct, k.kmPct) * 100);
                  return (
                    <tr key={w.id} className={i % 2 ? "" : "bg-surface-low/40"}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={w.avatar} className="h-9 w-9 rounded-full object-cover" alt="" />
                          <div>
                            <div className="font-semibold text-sm">{w.displayName}</div>
                            <div className="text-xs text-foreground-muted">{w.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-sm">{w.jobTitle}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-sm font-semibold">{k.visits}/{k.visitsTarget}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-sm font-semibold">{k.km}/{k.kmTarget}</td>
                      <td className="px-2 py-3 text-right tabular-nums text-sm font-bold">{pace}%</td>
                      <td className="px-2 py-3"><StatusChip status={k.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => openEdit(w)}
                            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                          >Edit</button>
                          <button
                            onClick={() => setRemoveTarget(w)}
                            className="text-xs font-semibold text-foreground-muted hover:text-danger transition-colors"
                          >Remove</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !workersLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-foreground-muted">
                      No workers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
            <DialogDescription>Provision a new field operative into the workforce.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Full Name" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
            <Field label="Email" type="email" value={draft.email} onChange={v => setDraft({ ...draft, email: v })} />
            <Field label="Job Title" value={draft.role} onChange={v => setDraft({ ...draft, role: v })} />
            <Field label="Daily KM Target" type="number" value={String(draft.dailyKmTarget)} onChange={v => setDraft({ ...draft, dailyKmTarget: +v || 0 })} />
          </div>
          <DialogFooter>
            <Button variant="primary" onClick={submit} disabled={addWorkerMutation.isPending}>
              {addWorkerMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Worker"}
            </Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editWorker !== null} onOpenChange={(open) => { if (!open) setEditWorker(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Worker</DialogTitle>
            <DialogDescription>Update worker details. Email cannot be changed as it is the unique identifier.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Full Name" value={editDraft.name} onChange={v => setEditDraft({ ...editDraft, name: v })} />
            <Field label="Email" type="email" value={editDraft.email} onChange={() => {}} disabled />
            <Field label="Role" value={editDraft.role} onChange={v => setEditDraft({ ...editDraft, role: v })} />
            <Field label="Daily KM Target" type="number" value={String(editDraft.dailyKmTarget)} onChange={v => setEditDraft({ ...editDraft, dailyKmTarget: +v || 0 })} />
          </div>
          <DialogFooter>
            <Button variant="primary" onClick={saveEdit} disabled={updateWorkerMutation.isPending}>
              {updateWorkerMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
            </Button>
            <Button variant="ghost" onClick={() => setEditWorker(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmActionDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="Remove Worker"
        description={removeTarget ? `Are you sure you want to remove ${removeTarget.displayName}? This action cannot be undone.` : ""}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground-muted">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="mt-1.5 w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
    </div>
  );
}
