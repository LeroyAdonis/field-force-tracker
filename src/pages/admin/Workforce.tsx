import { useApp } from "@/lib/store";
import { dailyKpis, rangeKpis, weekProgress, monthProgress, statusColor, statusLabel } from "@/lib/kpi";
import { StatusChip } from "@/components/StatusChip";
import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(query.toLowerCase()) || w.role.toLowerCase().includes(query.toLowerCase())
  );

  const computeKpi = (w: typeof workers[number]) => {
    if (period === "day") return dailyKpis(w, visits, dailyVisitsTarget);
    if (period === "week") return rangeKpis(w, visits, 7, dailyVisitsTarget, weekProgress());
    return rangeKpis(w, visits, 30, dailyVisitsTarget, monthProgress());
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="label-eyebrow">Workforce</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">All Workers</h1>
          <p className="text-foreground-muted text-sm mt-1">KPI rollups across daily, weekly, and monthly cadence.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="surface-recessed p-1 flex">
            {(["day", "week", "month"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  period === p ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground-muted"
                }`}>
                {p}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAdd(true)} variant="primary"><Plus className="h-4 w-4" /> Add Worker</Button>
        </div>
      </div>

      <div className="surface-card p-4 lg:p-6">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search workers..."
            className="w-full h-10 pl-11 pr-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all text-sm" />
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
                      <button
                        onClick={() => { removeWorker(w.id); toast.success("Worker removed"); }}
                        className="text-xs font-semibold text-foreground-muted hover:text-danger transition-colors"
                      >Remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Worker modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="surface-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="label-eyebrow">Provision</div>
                <h2 className="text-xl font-extrabold mt-1">Add New Worker</h2>
              </div>
              <button onClick={() => setShowAdd(false)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-low">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Full Name" value={draft.name} onChange={v => setDraft({ ...draft, name: v })} />
              <Field label="Email" type="email" value={draft.email} onChange={v => setDraft({ ...draft, email: v })} />
              <Field label="Job Title" value={draft.role} onChange={v => setDraft({ ...draft, role: v })} />
              <Field label="Daily KM Target" type="number" value={String(draft.dailyKmTarget)} onChange={v => setDraft({ ...draft, dailyKmTarget: +v || 0 })} />
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="primary" className="flex-1" onClick={submit}>Create Worker</Button>
              <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground-muted">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all text-sm" />
    </div>
  );
}
