import { useApp } from "@/lib/store";
import { Visit } from "@/lib/types";

export function useVisits() {
  const { visits, workers, sites } = useApp();
  
  const visitData = visits.map(v => ({
    ...v,
    workerName: workers.find(w => w.id === v.workerId)?.name || "Unknown",
    siteName: sites.find(s => s.id === v.siteId)?.name || "Unknown",
    createdAt: v.timestamp,
    updatedAt: v.timestamp,
  }));

  return { data: visitData, isLoading: false, error: null, refetch: () => {} };
}

export function useVisit(id: string) {
  const { visits, workers, sites } = useApp();
  const visit = visits.find(v => v.id === id);
  
  const visitData = visit ? {
    ...visit,
    workerName: workers.find(w => w.id === visit.workerId)?.name || "Unknown",
    siteName: sites.find(s => s.id === visit.siteId)?.name || "Unknown",
    createdAt: visit.timestamp,
    updatedAt: visit.timestamp,
  } : undefined;

  return { data: visitData, isLoading: false, error: null };
}

export function useAddVisit() {
  const addVisit = useApp((s) => s.addVisit);
  return { mutate: addVisit, isLoading: false };
}

export function useUpdateVisit() {
  const updateVisit = useApp((s) => s.updateVisit);
  return { mutate: ({ id, updates }: { id: string; updates: Partial<Visit> }) => updateVisit(id, updates), isLoading: false };
}

export function useDeleteVisit() {
  const removeVisit = useApp((s) => s.removeVisit);
  return { mutate: removeVisit, isLoading: false };
}
