import type { Worker, Visit, Site } from "./types";
import type { WorkerData } from "@/hooks/useWorkers";
import type { VisitData } from "@/hooks/useVisits";
import type { SiteData } from "@/hooks/useSites";

export function toWorker(w: WorkerData): Worker {
  return {
    id: w.id,
    name: w.displayName || w.email || "Worker",
    email: w.email || "",
    role: w.jobTitle || "Field Worker",
    avatar: w.avatar || `https://i.pravatar.cc/120?u=${w.id}`,
    dailyKmTarget: w.dailyKmTarget ?? 60,
    active: w.active ?? true,
  };
}

export function toVisit(v: VisitData): Visit {
  const km = typeof v.km === "string" ? parseFloat(v.km) : (v.km ?? 0);
  return {
    id: v.id,
    workerId: v.workerId,
    siteId: v.siteId,
    date: v.date,
    timestamp: v.timestamp,
    km,
    inspection: v.inspection
      ? {
          id: v.inspection.id,
          visitId: v.id,
          type: v.inspection.type,
          notes: v.inspection.notes ?? "",
          timestamp: v.inspection.timestamp,
          photos: v.inspection.photos?.map((p) => ({
            id: p.id,
            dataUrl: p.dataUrl,
            caption: p.caption ?? undefined,
          })),
        }
      : {
          id: `_${v.id}`,
          visitId: v.id,
          type: "Unknown",
          notes: "",
          timestamp: v.timestamp,
        },
  };
}

export function toSite(s: SiteData): Site {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    zone: s.zone,
    active: s.active,
  };
}
