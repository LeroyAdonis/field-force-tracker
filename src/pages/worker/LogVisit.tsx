import { useState, useMemo, useRef } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Search, Check, FileText, Camera, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/mock-data";

const inspectionTypes = ["Structural Audit", "Safety Inspection", "Compliance Check", "Foundation Review", "Electrical Survey"];

const MAX_PHOTOS = 6;
const MAX_DIM = 1600; // px — downscale for storage sanity
const JPEG_QUALITY = 0.82;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export default function LogVisit() {
  const { user, sites, addSite, addVisit } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", address: "", zone: "" });
  const [km, setKm] = useState("");
  const [type, setType] = useState(inspectionTypes[0]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<{ dataUrl: string; caption?: string }[]>([]);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    sites.filter(s => s.active && (s.name.toLowerCase().includes(query.toLowerCase()) || s.address.toLowerCase().includes(query.toLowerCase()))),
    [sites, query]);

  if (!user || user.role !== "worker") return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) { toast.error("Please select a site"); return; }
    const kmNum = parseFloat(km);
    if (isNaN(kmNum) || kmNum < 0) { toast.error("Enter a valid distance"); return; }
    if (!notes.trim()) { toast.error("Add inspection notes"); return; }
    addVisit({
      workerId: user.id, siteId, date: todayISO, timestamp: new Date().toISOString(),
      km: kmNum, inspectionType: type, notes: notes.trim(),
    });
    toast.success("Site visit logged", { description: "KPI progress updated." });
    navigate("/worker");
  };

  const addNewSite = () => {
    if (!newSite.name.trim() || !newSite.address.trim()) { toast.error("Name and address required"); return; }
    const s = addSite({ ...newSite, active: true });
    setSiteId(s.id);
    setShowNew(false);
    setNewSite({ name: "", address: "", zone: "" });
    toast.success("Site added", { description: s.name });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <div className="label-eyebrow">New Entry</div>
        <h1 className="text-3xl font-extrabold mt-1">Log Site Visit</h1>
        <p className="text-foreground-muted mt-1 text-sm">Record where you've been, what you inspected, and the distance covered.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Site selection */}
        <div className="surface-card p-5">
          <div className="label-eyebrow mb-3">1 · Select Site</div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search sites or addresses..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all"
            />
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto pr-1 space-y-1.5">
            {filtered.map(s => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSiteId(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                  siteId === s.id ? "bg-primary text-primary-foreground shadow-soft" : "bg-surface-low hover:bg-surface-high"
                }`}
              >
                <div className={`h-9 w-9 rounded-lg grid place-items-center ${siteId === s.id ? "bg-primary-foreground/15" : "bg-surface-high"}`}>
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{s.name}</div>
                  <div className={`text-xs truncate ${siteId === s.id ? "text-primary-foreground/70" : "text-foreground-muted"}`}>
                    {s.address} · {s.zone}
                  </div>
                </div>
                {siteId === s.id && <Check className="h-4 w-4" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-foreground-muted py-4 text-center">No matches.</div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border/60">
            {!showNew ? (
              <Button type="button" variant="soft" size="sm" onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> Add new site
              </Button>
            ) : (
              <div className="space-y-2">
                <input
                  placeholder="Site name" value={newSite.name}
                  onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-surface-low outline-none focus:shadow-glow text-sm"
                />
                <input
                  placeholder="Address" value={newSite.address}
                  onChange={e => setNewSite({ ...newSite, address: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-surface-low outline-none focus:shadow-glow text-sm"
                />
                <input
                  placeholder="Zone (e.g. North)" value={newSite.zone}
                  onChange={e => setNewSite({ ...newSite, zone: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-surface-low outline-none focus:shadow-glow text-sm"
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="primary" onClick={addNewSite}>Save site</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mileage + inspection */}
        <div className="surface-card p-5 space-y-4">
          <div className="label-eyebrow">2 · Inspection Details</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground-muted">Distance (km)</label>
              <input
                type="number" inputMode="decimal" step="0.1" min="0"
                value={km} onChange={e => setKm(e.target.value)}
                placeholder="0.0"
                className="mt-1.5 w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all tabular-nums font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-muted">Inspection Type</label>
              <select
                value={type} onChange={e => setType(e.target.value)}
                className="mt-1.5 w-full h-11 px-3 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all font-medium text-sm"
              >
                {inspectionTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground-muted">Notes</label>
            <div className="relative mt-1.5">
              <FileText className="absolute left-4 top-4 h-4 w-4 text-foreground-muted" />
              <textarea
                value={notes} onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder="What did you inspect? Findings, follow-ups, photos uploaded..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all text-sm leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Log Visit & Update KPIs
        </Button>
      </form>
    </div>
  );
}
