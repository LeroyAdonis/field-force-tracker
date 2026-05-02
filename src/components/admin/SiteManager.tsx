"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Plus, Pencil, Power, Loader2, Search } from "lucide-react";

export function SiteManager() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editSite, setEditSite] = useState<any>(null);
  const [form, setForm] = useState({ name: "", address: "", region: "" });
  const [saving, setSaving] = useState(false);

  const fetchSites = useCallback(async () => {
    const res = await fetch("/api/sites?all=true");
    const data = await res.json();
    setSites(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const filtered = sites.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.region ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    if (editSite) {
      await fetch(`/api/sites/${editSite.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/sites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false); setShowAdd(false); setEditSite(null);
    setForm({ name: "", address: "", region: "" });
    fetchSites();
  }

  async function toggleStatus(site: any) {
    await fetch(`/api/sites/${site.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: site.status === "active" ? "inactive" : "active" }),
    });
    fetchSites();
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-400" />Sites ({sites.filter(s => s.status === "active").length} active)
          </CardTitle>
          <Button size="sm" onClick={() => { setForm({ name:"",address:"",region:"" }); setEditSite(null); setShowAdd(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />Add Site
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sites..." className="pl-9 bg-slate-700 border-slate-600 text-white text-sm" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 text-slate-400 animate-spin" /></div>
        : filtered.length === 0 ? <p className="text-slate-500 text-sm text-center py-6">No sites found.</p>
        : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filtered.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                s.status === "active" ? "bg-slate-900/50 border-slate-700/60" : "bg-slate-900/20 border-slate-800/40 opacity-60"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "active" ? "bg-emerald-400" : "bg-slate-600"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.name}</p>
                  {(s.address || s.region) && (
                    <p className="text-slate-500 text-xs truncate">{[s.region, s.address].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setForm({name:s.name,address:s.address||"",region:s.region||""}); setEditSite(s); setShowAdd(true); }}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleStatus(s)}
                    className={`h-7 w-7 p-0 hover:bg-slate-700 ${s.status === "active" ? "text-emerald-400 hover:text-red-400" : "text-slate-500 hover:text-emerald-400"}`}>
                    <Power className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) { setShowAdd(false); setEditSite(null); }}}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">{editSite ? "Edit Site" : "Add New Site"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {[
              { key:"name", label:"Site Name *", placeholder:"e.g. Johannesburg CBD Office" },
              { key:"address", label:"Address", placeholder:"Street address" },
              { key:"region", label:"Region", placeholder:"e.g. Gauteng" },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-slate-300 text-sm">{f.label}</Label>
                <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                  placeholder={f.placeholder} className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowAdd(false); setEditSite(null); }}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name || saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editSite ? "Save" : "Add Site")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
