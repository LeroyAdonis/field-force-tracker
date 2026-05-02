"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Pencil, Trash2, Loader2, Search, Settings2 } from "lucide-react";

export function WorkerManager() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editWorker, setEditWorker] = useState<any>(null);
  const [form, setForm] = useState({ name:"", email:"", region:"", phone:"", employeeId:"", dailyVisitTarget:"", dailyKmTarget:"" });
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [globalForm, setGlobalForm] = useState({ defaultDailyVisitTarget:"", defaultDailyKmTarget:"" });

  const fetchAll = useCallback(async () => {
    const [wRes, sRes] = await Promise.all([
      fetch("/api/admin/workers"),
      fetch("/api/admin/settings"),
    ]);
    const [wData, sData] = await Promise.all([wRes.json(), sRes.json()]);
    setWorkers(Array.isArray(wData) ? wData : []);
    setSettings(sData);
    setGlobalForm({ defaultDailyVisitTarget: String(sData.defaultDailyVisitTarget), defaultDailyKmTarget: String(sData.defaultDailyKmTarget) });
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = workers.filter(w =>
    w.user.name.toLowerCase().includes(search.toLowerCase()) ||
    w.user.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSaveWorker() {
    if (!editWorker) return;
    setSaving(true);
    await fetch(`/api/admin/workers/${editWorker.user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, email: form.email, region: form.region,
        phone: form.phone, employeeId: form.employeeId,
        dailyVisitTarget: form.dailyVisitTarget ? parseInt(form.dailyVisitTarget) : null,
        dailyKmTarget: form.dailyKmTarget ? parseFloat(form.dailyKmTarget) : null,
      }),
    });
    setSaving(false); setEditWorker(null); fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this worker? This will delete all their data.")) return;
    await fetch(`/api/admin/workers/${id}`, { method: "DELETE" });
    fetchAll();
  }

  async function handleSaveGlobal() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultDailyVisitTarget: parseInt(globalForm.defaultDailyVisitTarget),
        defaultDailyKmTarget: parseFloat(globalForm.defaultDailyKmTarget),
      }),
    });
    setSaving(false); setShowSettings(false); fetchAll();
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />Workers ({workers.length})
          </CardTitle>
          <Button size="sm" onClick={() => setShowSettings(true)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 gap-1.5 text-xs border border-slate-600">
            <Settings2 className="h-3.5 w-3.5" />Global KPI Targets
          </Button>
        </div>
        {settings && (
          <p className="text-slate-500 text-xs mt-1">
            Global defaults: {settings.defaultDailyVisitTarget} sites/day · {settings.defaultDailyKmTarget} km/day
          </p>
        )}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workers..." className="pl-9 bg-slate-700 border-slate-600 text-white text-sm" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-slate-400 animate-spin" /></div>
        : filtered.length === 0 ? <p className="text-slate-500 text-sm text-center py-6">No workers found.</p>
        : (
          <div className="space-y-2">
            {filtered.map(({ user: u, profile: p }) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/60">
                <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-300 text-sm font-bold">{u.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-slate-500 text-xs truncate">{u.email}</p>
                  {p && (
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Targets: {p.dailyVisitTarget ?? "global"} sites · {p.dailyKmTarget ?? "global"} km
                      {p.region && ` · ${p.region}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setEditWorker({ user: u, profile: p });
                    setForm({ name: u.name, email: u.email, region: p?.region||"", phone: p?.phone||"",
                      employeeId: p?.employeeId||"", dailyVisitTarget: p?.dailyVisitTarget?.toString()||"",
                      dailyKmTarget: p?.dailyKmTarget?.toString()||"" });
                  }} className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-slate-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Worker Dialog */}
      <Dialog open={!!editWorker} onOpenChange={v => { if (!v) setEditWorker(null); }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Edit Worker</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { k:"name", l:"Full Name", p:"Name" }, { k:"email", l:"Email", p:"email@example.com" },
              { k:"employeeId", l:"Employee ID", p:"EMP001" }, { k:"region", l:"Region", p:"e.g. Gauteng" },
              { k:"phone", l:"Phone", p:"+27 xx xxx xxxx" },
              { k:"dailyVisitTarget", l:`Daily Visit Target (global: ${settings?.defaultDailyVisitTarget ?? 12})`, p:"Leave blank for global" },
              { k:"dailyKmTarget", l:`Daily Km Target (global: ${settings?.defaultDailyKmTarget ?? 100})`, p:"Leave blank for global" },
            ].map(f => (
              <div key={f.k} className="space-y-1">
                <Label className="text-slate-300 text-xs">{f.l}</Label>
                <Input value={(form as any)[f.k]} onChange={e => setForm(pr => ({...pr,[f.k]:e.target.value}))}
                  placeholder={f.p} className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 text-sm h-8" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditWorker(null)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 text-sm">Cancel</Button>
              <Button onClick={handleSaveWorker} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white flex items-center gap-2"><Settings2 className="h-4 w-4" />Global KPI Targets</DialogTitle></DialogHeader>
          <p className="text-slate-400 text-xs">Applied to all workers without individual targets set.</p>
          <div className="space-y-3 mt-2">
            {[
              { k:"defaultDailyVisitTarget", l:"Daily Site Visits Target", p:"12" },
              { k:"defaultDailyKmTarget", l:"Daily Km Target", p:"100" },
            ].map(f => (
              <div key={f.k} className="space-y-1.5">
                <Label className="text-slate-300 text-sm">{f.l}</Label>
                <Input type="number" value={(globalForm as any)[f.k]} onChange={e => setGlobalForm(pr => ({...pr,[f.k]:e.target.value}))}
                  placeholder={f.p} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
              <Button onClick={handleSaveGlobal} disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
