import { useState, useMemo } from "react";
import { useApp } from "@/lib/store";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DebouncedSearchInput } from "@/components/DebouncedSearchInput";
import { VisitDetailDrawer } from "@/components/VisitDetailDrawer";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVisits, type VisitData } from "@/hooks/useVisits";
import { useSites } from "@/hooks/useSites";

const inspectionTypes = ["Structural Audit", "Safety Inspection", "Compliance Check", "Foundation Review", "Electrical Survey"];
const INITIAL_DAYS = 30;
const LOAD_MORE_INCREMENT = 15;

export default function VisitHistory() {
  const { user } = useApp();
  const navigate = useNavigate();
  const { data: visits = [] } = useVisits();
  const { data: sites = [] } = useSites();

  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [inspectionFilter, setInspectionFilter] = useState<string>("all");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS);

  const [selectedVisit, setSelectedVisit] = useState<VisitData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!user) return null;

  const mine = visits
    .filter(v => v.workerId === user.id)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  const filtered = mine.filter(v => {
    const site = sites.find(s => s.id === v.siteId);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const siteName = site?.name?.toLowerCase() ?? "";
      const inspType = v.inspection?.type?.toLowerCase() ?? "";
      if (!siteName.includes(q) && !inspType.includes(q)) return false;
    }

    if (inspectionFilter !== "all" && v.inspection?.type !== inspectionFilter) return false;

    if (dateFrom || dateTo) {
      const visitDate = new Date(v.date);
      visitDate.setHours(0, 0, 0, 0);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (visitDate < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (visitDate > to) return false;
      }
    }

    return true;
  });

  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, v) => {
    (acc[v.date] ||= []).push(v);
    return acc;
  }, {});

  const groupEntries = Object.entries(groups);
  const displayedEntries = groupEntries.slice(0, visibleDays);
  const hasMore = groupEntries.length > visibleDays;

  const totalVisits = filtered.length;
  const displayedVisits = displayedEntries.reduce((sum, [, items]) => sum + items.length, 0);

  const openVisitDetail = (visit: VisitData) => {
    setSelectedVisit(visit);
    setDrawerOpen(true);
  };

  const openLightbox = (visit: VisitData, photoIndex: number) => {
    const photos = visit.inspection?.photos?.map(p => p.dataUrl) ?? [];
    setLightboxPhotos(photos);
    setLightboxIndex(photoIndex);
    setLightboxOpen(true);
  };

  const formatDateRange = () => {
    if (!dateFrom && !dateTo) return "All dates";
    const fromStr = dateFrom ? dateFrom.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "Start";
    const toStr = dateTo ? dateTo.toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "Now";
    return `${fromStr} — ${toStr}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <div className="label-eyebrow">Personal Log</div>
        <h1 className="text-3xl font-extrabold mt-1">Visit History</h1>
        <p className="text-foreground-muted text-sm mt-1">Every site visit and inspection you've recorded.</p>
      </div>

      <div className="space-y-3">
        <DebouncedSearchInput
          onValueChange={setSearchQuery}
          placeholder="Search by site name or inspection type..."
          debounceMs={300}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground-muted">From</label>
                  <CalendarComponent
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => { setDateFrom(d ?? undefined); }}
                    className="rounded-md border"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground-muted">To</label>
                  <CalendarComponent
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => { setDateTo(d ?? undefined); }}
                    className="rounded-md border"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => { setDateFrom(undefined); setDateTo(undefined); setDatePopoverOpen(false); }}
                >
                  Clear dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={inspectionFilter} onValueChange={setInspectionFilter}>
            <SelectTrigger className="h-9 w-[180px] text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {inspectionTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || dateFrom || dateTo || inspectionFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                setSearchQuery("");
                setDateFrom(undefined);
                setDateTo(undefined);
                setInspectionFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="text-xs text-foreground-muted tabular-nums">
        Showing {displayedVisits} of {totalVisits} visits
      </div>

      <div className="space-y-6">
        {displayedEntries.map(([date, items]) => {
          const totalKm = items.reduce((s, v) => s + Number(v.km), 0).toFixed(1);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="font-bold text-sm">{new Date(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</div>
                <div className="text-xs text-foreground-muted tabular-nums">{items.length} visits · {totalKm} km</div>
              </div>
              <div className="surface-card p-2">
                {items.map((v, i) => {
                  const site = sites.find(s => s.id === v.siteId);
                  const t = new Date(v.timestamp);
                  const photos = v.inspection?.photos ?? [];
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => openVisitDetail(v)}
                      className={`w-full p-3 rounded-xl text-left transition-colors hover:bg-surface-high ${i % 2 ? "" : "bg-surface-low/40"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-foreground-muted tabular-nums w-12 shrink-0 mt-0.5">
                          {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")}
                        </div>
                        <MapPin className="h-4 w-4 text-foreground-muted shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{site?.name ?? v.siteName ?? "Unknown site"}</div>
                          <div className="text-xs text-foreground-muted truncate">{v.inspection?.type} · {v.inspection?.notes}</div>
                        </div>
                        <div className="text-xs font-bold tabular-nums shrink-0">{v.km} km</div>
                      </div>
                      {photos.length > 0 && (
                        <div className="mt-2 ml-[60px] flex gap-1.5 overflow-x-auto pb-1">
                          {photos.map((p, pIdx) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openLightbox(v, pIdx); }}
                              className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-low ring-1 ring-border/50 hover:ring-primary/60 transition"
                              title={p.caption || "Site photo"}
                            >
                              <img src={p.dataUrl} alt={p.caption || "Site photo"} className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {displayedEntries.length === 0 && (
          <div className="text-sm text-foreground-muted py-8 text-center">
            {totalVisits === 0 ? "No visits recorded yet." : "No visits match your filters."}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setVisibleDays(d => d + LOAD_MORE_INCREMENT)}>
            Load more
          </Button>
        </div>
      )}

      <VisitDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        visit={selectedVisit}
      />

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
