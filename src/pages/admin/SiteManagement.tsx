import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, X, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function SiteManagement() {
  const { sites, addSite, updateSite, removeSite, visits } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ name: "", address: "", zone: "" });

  const visitsBySite = visits.reduce<Record<string, number>>((acc, v) => {
    acc[v.siteId] = (acc[v.siteId] ?? 0) + 1;
    return acc;
  }, {});

  const create = () => {
    if (!draft.name.trim() || !draft.address.trim()) { toast.error("Name and address required"); return; }
    addSite({ ...draft, active: true });
    setDraft({ name: "", address: "", zone: "" });
    setShowAdd(false);
    toast.success("Site created");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="label-eyebrow">Master List</div>
          <h1 className="text-3xl lg:text-4xl font-extrabold mt-1">Site Management</h1>
          <p className="text-foreground-muted text-sm mt-1">Manage the canonical list of inspectable sites.</p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> New Site</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(s => (
          <div key={s.id} className="surface-card p-5">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-accent/10 grid place-items-center text-accent">
                <MapPin className="h-4 w-4" />
              </div>
              <button
                onClick={() => updateSite(s.id, { active: !s.active })}
                className={`chip ${s.active ? "chip-success" : "chip-neutral"} cursor-pointer`}
              >{s.active ? "Active" : "Inactive"}</button>
            </div>
            <div className="font-bold mt-4">{s.name}</div>
            <div className="text-xs text-foreground-muted mt-1">{s.address}</div>
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs">
              <div className="text-foreground-muted">Zone · <span className="font-semibold text-foreground">{s.zone || "—"}</span></div>
              <div className="font-bold tabular-nums">{visitsBySite[s.id] ?? 0} visits</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => removeSite(s.id)}
                className="text-xs font-semibold text-foreground-muted hover:text-danger transition-colors"
              >Remove</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAdd(false)}>
          <div className="surface-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold">Add New Site</h2>
              <button onClick={() => setShowAdd(false)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-low">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input placeholder="Site name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none text-sm" />
              <input placeholder="Address" value={draft.address} onChange={e => setDraft({ ...draft, address: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none text-sm" />
              <input placeholder="Zone" value={draft.zone} onChange={e => setDraft({ ...draft, zone: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none text-sm" />
            </div>
            <Button variant="primary" className="w-full mt-5" onClick={create}>Create Site</Button>
          </div>
        </div>
      )}
    </div>
  );
}
