"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Props { onClose: () => void; onSuccess: () => void; }

export function LogVisitModal({ onClose, onSuccess }: Props) {
  const [sites, setSites] = useState<any[]>([]);
  const [siteId, setSiteId] = useState("");
  const [newSiteName, setNewSiteName] = useState("");
  const [useNewSite, setUseNewSite] = useState(false);
  const [kmCovered, setKmCovered] = useState("");
  const [notes, setNotes] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [findings, setFindings] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/sites").then(r => r.json()).then(setSites).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const visitBody: any = {
        visitDate: today,
        arrivalTime: new Date().toISOString(),
        kmCovered: kmCovered ? parseFloat(kmCovered) : null,
        notes,
      };
      if (useNewSite) visitBody.siteName = newSiteName;
      else visitBody.siteId = parseInt(siteId);

      const visitRes = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visitBody),
      });
      const visit = await visitRes.json();
      if (!visitRes.ok) throw new Error(visit.error);

      // Log inspection if type provided
      if (inspectionType) {
        await fetch("/api/inspections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitId: visit.id, inspectionType, findings }),
        });
      }

      setDone(true);
      setTimeout(onSuccess, 800);
    } catch (err: any) {
      alert(err.message || "Failed to log visit");
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <MapPin className="h-5 w-5 text-orange-400" />
            Log Site Visit
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="text-white font-semibold">Visit logged!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Site selection */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Site</Label>
              {!useNewSite ? (
                <div className="flex gap-2">
                  <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white flex-1">
                      <SelectValue placeholder="Select a site..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600 text-white">
                      {sites.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)} className="focus:bg-slate-600">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setUseNewSite(true)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1 whitespace-nowrap">
                    <Plus className="h-3.5 w-3.5" />New
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={newSiteName} onChange={e => setNewSiteName(e.target.value)}
                    placeholder="New site name..." required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 flex-1" />
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setUseNewSite(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700">
                    List
                  </Button>
                </div>
              )}
            </div>

            {/* Km covered */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Km covered to reach this site</Label>
              <Input type="number" step="0.1" min="0" value={kmCovered}
                onChange={e => setKmCovered(e.target.value)}
                placeholder="e.g. 12.5"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" />
            </div>

            {/* Inspection */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Inspection type (optional)</Label>
              <Select value={inspectionType} onValueChange={(v) => setInspectionType(v ?? "")}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select inspection type..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  {["Safety Check","Quality Audit","Equipment Inspection","Compliance Check","Routine Visit","Follow-up"].map(t => (
                    <SelectItem key={t} value={t} className="focus:bg-slate-600">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {inspectionType && (
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Inspection findings</Label>
                <Textarea value={findings} onChange={e => setFindings(e.target.value)}
                  placeholder="Describe what was found or checked..."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]" />
              </div>
            )}

            {/* General notes */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[60px]" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={loading || (!siteId && !newSiteName)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log Visit"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
