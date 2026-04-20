import { useApp } from "@/lib/store";
import { dailyKpis, rangeKpis, weekProgress, monthProgress, statusColor, statusLabel } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { useState, useTransition, useCallback } from "react";
import { Plus, Search, X, Loader2 } from "lucide-react";
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
import type { Worker } from "@/lib/types";

const avatars = [
  "https://i.pravatar.cc/120?img=22",
  "https://i.pravatar.cc/120?img=44",
  "https://i.pravatar.cc/120?img=56",
  "https://i.pravatar.cc/120?img=68",
];

export default function Workforce() {
  const { workers, visits, dailyVisitsTarget, addWorker, removeWorker, updateWorker } = useApp();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });

  // 7.1 — Edit worker dialog state
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });

  // 7.2 — Confirm remove dialog state
  const [removeTarget, setRemoveTarget] = useState<Worker | null>(null);

  // 7.4 — useTransition for period toggle
  const [isPending, startTransition] = useTransition();

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(query.toLowerCase()) || w.role.toLowerCase().includes(query.toLowerCase())
  );

  const computeKpi = (w: typeof workers[number]) => {
    if (period === "day") return dailyKpis(w, visits, dailyVisitsTarget);
    if (period === "week") return rangeKpis(w, visits, 7, dailyVisitsTarget, weekProgress());
    return rangeKpis(w, visits, 30, dailyVisitsTarget, monthProgress());
  };

  // 7.4 — Wrap period change in startTransition
  const handlePeriodChange = (p: "day" | "week" | "month") => {
    startTransition(() => {
      setPeriod(p);
    });
  };

  const submit = () => {
    if (!draft.name.trim() || !draft.email.trim()) { toast.error("Name and email required"); return; }
    addWorker({
      ...draft,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      active: true,
    });
    setDraft({ name: "", email: "", role: "Field Inspector", dailyKmTarget: 60 });
    setShowAdd(false);
    toast.success("Worker added");
  };

  // 7.1 — Open edit dialog pre-populated with worker data
  const openEdit = (w: Worker) => {
    setEditWorker(w);
    setEditDraft({ name: w.name, email: w.email, role: w.role, dailyKmTarget: w.dailyKmTarget });
  };

  // 7.1 — Save edited worker
  const saveEdit = () => {
    if (!editWorker) return;
    if (!editDraft.name.trim()) { toast.error("Name is required"); return; }
    updateWorker(editWorker.id, {
      name: editDraft.name,
      role: editDraft.role,
      dailyKmTarget: editDraft.dailyKmTarget,
    });
    setEditWorker(null);
    toast.success("Worker updated");
  };

  // 7.2 — Confirm remove handler
  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    removeWorker(removeTarget.id);
    setRemoveTarget(null);
    toast.success("Worker removed");
  };

  // 7.3 — Debounced search handler
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
          {/* 7.4 — Period toggle with useTransition and loading indicator */}
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
        {/* 7.3 — Replace search input with DebouncedSearchInput */}
        <div className="max-w-sm mb-4">
          <DebouncedSearchInput
            onValueChange={handleSearchChange}
            placeholder="Search workers..."
            debounceMs={300}
          />
        </div>

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
                          <div className="font-semibold text-sm">{w.name}</div>
                          <div className="text-xs text-foreground-muted">{w.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm">{w.role}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-sm font-semibold">{k.visits}/{k.visitsTarget}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-sm font-semibold">{k.km}/{k.kmTarget}</td>
                    <td className="px-2 py-3 text-right tabular-nums text-sm font-bold">{pace}%</td>
                    <td className="px-2 py-3"><StatusChip status={k.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* 7.1 — Edit button */}
                        <button
                          onClick={() => openEdit(w)}
                          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >Edit</button>
                        {/* 7.2 — Remove now opens ConfirmActionDialog instead of instant deletion */}
                        <button
                          onClick={() => setRemoveTarget(w)}
                          className="text-xs font-semibold text-foreground-muted hover:text-danger transition-colors"
                        >Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7.5 — Add Worker modal using Dialog component */}
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
            <Button variant="primary" onClick={submit}>Create Worker</Button>
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7.1 — Edit Worker Dialog */}
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
            <Button variant="primary" onClick={saveEdit}>Save</Button>
            <Button variant="ghost" onClick={() => setEditWorker(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7.2 — Confirm Remove Dialog */}
      <ConfirmActionDialog
        open={removeTarget !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        title="Remove Worker"
        description={removeTarget ? `Are you sure you want to remove ${removeTarget.name}? This action cannot be undone.` : ""}
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
