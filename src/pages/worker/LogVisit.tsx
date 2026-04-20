import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Plus, Check, FileText, Camera, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/mock-data";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";

const inspectionTypes = ["Structural Audit", "Safety Inspection", "Compliance Check", "Foundation Review", "Electrical Survey"];

const MAX_PHOTOS = 6;
const MAX_DIM = 1600; // px — downscale for storage sanity
const JPEG_QUALITY = 0.82;
const MAX_NOTES_LENGTH = 500;

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

interface TouchedFields {
  siteId: boolean;
  km: boolean;
  notes: boolean;
}

function validateSiteId(siteId: string | null): string | null {
  if (!siteId) return "Please select a site";
  return null;
}

function validateKm(km: string): string | null {
  if (!km) return "Distance is required";
  const kmNum = parseFloat(km);
  if (isNaN(kmNum) || kmNum < 0) return "Enter a valid distance";
  return null;
}

function validateNotes(notes: string): string | null {
  if (!notes.trim()) return "Add inspection notes";
  if (notes.length > MAX_NOTES_LENGTH) return `Notes must be ${MAX_NOTES_LENGTH} characters or less`;
  return null;
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

  // 4.1 — Touched tracking for inline validation
  const [touched, setTouched] = useState<TouchedFields>({ siteId: false, km: false, notes: false });

  // 4.3 — Camera availability
  const [hasCamera, setHasCamera] = useState(false);

  // 4.4 — Submit loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4.5 — Reset form on mount
  useEffect(() => {
    setQuery("");
    setSiteId(null);
    setShowNew(false);
    setNewSite({ name: "", address: "", zone: "" });
    setKm("");
    setType(inspectionTypes[0]);
    setNotes("");
    setPhotos([]);
    setTouched({ siteId: false, km: false, notes: false });
  }, []);

  // 4.3 — Check camera availability
  useEffect(() => {
    let cancelled = false;
    const checkCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          if (!cancelled) setHasCamera(false);
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) {
          setHasCamera(devices.some(d => d.kind === "videoinput"));
        }
      } catch {
        if (!cancelled) setHasCamera(false);
      }
    };
    checkCamera();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() =>
    sites.filter(s => s.active && (s.name.toLowerCase().includes(query.toLowerCase()) || s.address.toLowerCase().includes(query.toLowerCase()))),
    [sites, query]);

  if (!user || user.role !== "worker") return null;

  // 4.1 — Validation helpers (show errors only after field is touched)
  const siteIdError = touched.siteId ? validateSiteId(siteId) : null;
  const kmError = touched.km ? validateKm(km) : null;
  const notesError = touched.notes ? validateNotes(notes) : null;

  // 4.1 — Disable submit until all required fields are valid
  const isFormValid = !validateSiteId(siteId) && !validateKm(km) && !validateNotes(notes);

  const markTouched = (field: keyof TouchedFields) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched to show errors
    setTouched({ siteId: true, km: true, notes: true });

    if (!isFormValid) return;

    // 4.4 — Loading state with simulated async
    setIsSubmitting(true);
    setTimeout(() => {
      addVisit({
        workerId: user.id, siteId, date: todayISO, timestamp: new Date().toISOString(),
        km: parseFloat(km), inspectionType: type, notes: notes.trim(),
        photos: photos.length ? photos : undefined,
      });
      toast.success("Site visit logged", { description: "KPI progress updated." });
      setIsSubmitting(false);
      navigate("/worker");
    }, 200);
  };

  const addNewSite = () => {
    if (!newSite.name.trim() || !newSite.address.trim()) { toast.error("Name and address required"); return; }
    const s = addSite({ ...newSite, active: true });
    setSiteId(s.id);
    setShowNew(false);
    setNewSite({ name: "", address: "", zone: "" });
    toast.success("Site added", { description: s.name });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_PHOTOS} photos per visit`); return; }
    const slice = Array.from(files).slice(0, remaining);
    try {
      const next: { dataUrl: string }[] = [];
      for (const f of slice) {
        if (!f.type.startsWith("image/")) continue;
        next.push({ dataUrl: await fileToCompressedDataUrl(f) });
      }
      if (next.length) {
        setPhotos(p => [...p, ...next]);
        toast.success(`${next.length} photo${next.length > 1 ? "s" : ""} attached`);
      }
    } catch {
      toast.error("Couldn't process image");
    }
  };

  const removePhoto = (idx: number) => setPhotos(p => p.filter((_, i) => i !== idx));
  const updateCaption = (idx: number, caption: string) =>
    setPhotos(p => p.map((ph, i) => (i === idx ? { ...ph, caption } : ph)));

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
          {/* 4.2 — Debounced search input */}
          <DebouncedSearchInput
            onValueChange={setQuery}
            placeholder="Search sites or addresses..."
            debounceMs={300}
          />

          {/* 4.1 — Inline validation error for site selection */}
          {siteIdError && (
            <p className="mt-2 text-xs text-destructive font-medium">{siteIdError}</p>
          )}

          <div className="mt-3 max-h-72 overflow-y-auto pr-1 space-y-1.5">
            {filtered.map(s => (
              <button
                type="button"
                key={s.id}
                onClick={() => { setSiteId(s.id); markTouched("siteId"); }}
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
                value={km}
                onChange={e => { setKm(e.target.value); }}
                onBlur={() => markTouched("km")}
                placeholder="0.0"
                className={`mt-1.5 w-full h-11 px-4 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all tabular-nums font-semibold ${
                  kmError ? "ring-2 ring-destructive" : ""
                }`}
              />
              {/* 4.1 — Inline validation error for km */}
              {kmError && (
                <p className="mt-1 text-xs text-destructive font-medium">{kmError}</p>
              )}
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
                value={notes}
                onChange={e => { setNotes(e.target.value); }}
                onBlur={() => markTouched("notes")}
                rows={4}
                maxLength={MAX_NOTES_LENGTH}
                placeholder="What did you inspect? Findings, follow-ups, photos uploaded..."
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-surface-low focus:bg-surface-lowest focus:shadow-glow outline-none transition-all text-sm leading-relaxed resize-none ${
                  notesError ? "ring-2 ring-destructive" : ""
                }`}
              />
            </div>
            {/* 4.1 — Character count + inline validation for notes */}
            <div className="flex items-center justify-between mt-1">
              {notesError ? (
                <p className="text-xs text-destructive font-medium">{notesError}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-foreground-muted tabular-nums">{notes.length} / {MAX_NOTES_LENGTH}</span>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">3 · Site Photos</div>
            <div className="text-xs text-foreground-muted tabular-nums">{photos.length} / {MAX_PHOTOS}</div>
          </div>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { handleFiles(e.target.files); e.target.value = ""; }}
          />

          <div className="grid grid-cols-2 gap-2">
            {/* 4.3 — Only show "Take photo" button if camera is available */}
            {hasCamera && (
              <Button
                type="button" variant="primary" size="lg"
                onClick={() => cameraRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
              >
                <Camera className="h-4 w-4" /> Take photo
              </Button>
            )}
            <Button
              type="button" variant={hasCamera ? "secondary" : "primary"} size="lg"
              onClick={() => galleryRef.current?.click()}
              disabled={photos.length >= MAX_PHOTOS}
              className={hasCamera ? "" : "w-full"}
            >
              <ImagePlus className="h-4 w-4" /> Upload
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-surface-low">
                    <img src={p.dataUrl} alt={`Site photo ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1.5 right-1.5 h-7 w-7 grid place-items-center rounded-full bg-background/90 shadow-soft hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <input
                    value={p.caption ?? ""}
                    onChange={e => updateCaption(i, e.target.value)}
                    placeholder="Caption (optional)"
                    className="mt-1.5 w-full h-8 px-2 rounded-lg bg-surface-low text-xs outline-none focus:shadow-glow"
                  />
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && (
            <p className="text-xs text-foreground-muted">
              Capture conditions on-site or attach existing images. Photos compress automatically.
            </p>
          )}
        </div>

        {/* 4.1 + 4.4 — Disabled when invalid or submitting; shows spinner during submission */}
        <Button type="submit" size="lg" className="w-full" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Logging visit…
            </>
          ) : (
            "Log Visit & Update KPIs"
          )}
        </Button>
      </form>
    </div>
  );
}
