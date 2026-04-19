import { useApp } from "@/lib/store";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VisitHistory() {
  const { user, visits, sites } = useApp();
  const navigate = useNavigate();
  if (!user) return null;

  const mine = visits
    .filter(v => v.workerId === user.id)
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));

  // group by date
  const groups = mine.reduce<Record<string, typeof mine>>((acc, v) => {
    (acc[v.date] ||= []).push(v);
    return acc;
  }, {});

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

      <div className="space-y-6">
        {Object.entries(groups).slice(0, 30).map(([date, items]) => {
          const totalKm = items.reduce((s, v) => s + v.km, 0).toFixed(1);
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
                  const photos = v.inspection.photos ?? [];
                  return (
                    <div key={v.id} className={`p-3 rounded-xl ${i % 2 ? "" : "bg-surface-low/40"}`}>
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-foreground-muted tabular-nums w-12 shrink-0 mt-0.5">
                          {String(t.getHours()).padStart(2, "0")}:{String(t.getMinutes()).padStart(2, "0")}
                        </div>
                        <MapPin className="h-4 w-4 text-foreground-muted shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{site?.name ?? "Unknown site"}</div>
                          <div className="text-xs text-foreground-muted truncate">{v.inspection.type} · {v.inspection.notes}</div>
                        </div>
                        <div className="text-xs font-bold tabular-nums shrink-0">{v.km} km</div>
                      </div>
                      {photos.length > 0 && (
                        <div className="mt-2 ml-[60px] flex gap-1.5 overflow-x-auto pb-1">
                          {photos.map(p => (
                            <a
                              key={p.id}
                              href={p.dataUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-surface-low ring-1 ring-border/50 hover:ring-primary/60 transition"
                              title={p.caption || "Site photo"}
                            >
                              <img src={p.dataUrl} alt={p.caption || "Site photo"} className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
