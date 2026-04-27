import { useApp } from "@/lib/store";
import { Visit } from "@/lib/types";
import { useVisits as useApiVisits } from "@/lib/api";

export function useVisits() {
  // Try to use API first, fallback to Zustand store if API fails
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useApiVisits();
  const { visits, workers, sites } = useApp();
  
  // If we have API data and no error, use it
  if (apiData !== undefined && !apiError) {
    const visitData = apiData.map(v => ({
      ...v,
      workerName: workers.find(w => w.id === v.workerId)?.name || "Unknown",
      siteName: sites.find(s => s.id === v.siteId)?.name || "Unknown",
      createdAt: v.timestamp,
      updatedAt: v.timestamp,
    }));
    return { 
      data: visitData, 
      isLoading: apiLoading, 
      error: null, 
      refetch: apiRefetch 
    };
  }
  
  // Otherwise fallback to Zustand store
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
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useApiVisits();
  const { visits, workers, sites } = useApp();
  const visit = visits.find(v => v.id === id);
  
  if (apiData !== undefined && !apiError) {
    const visitData = apiData.find(v => v.id === id);
    const visitWithNames = visitData ? {
      ...visitData,
      workerName: workers.find(w => w.id === visitData.workerId)?.name || "Unknown",
      siteName: sites.find(s => s.id === visitData.siteId)?.name || "Unknown",
      createdAt: visitData.timestamp,
      updatedAt: visitData.timestamp,
    } : undefined;
    
    return { 
      data: visitWithNames, 
      isLoading: apiLoading, 
      error: apiError, 
      refetch: apiRefetch 
    };
  }
  
  const visitData = visit ? {
    ...visit,
    workerName: workers.find(w => w.id === visit.workerId)?.name || "Unknown",
    siteName: sites.find(s => s.id === visit.siteId)?.name || "Unknown",
    createdAt: visit.timestamp,
    updatedAt: visit.timestamp,
  } : undefined;
  
  return { data: visitData, isLoading: false, error: null, refetch: () => {} };
}

export function useAddVisit() {
  const addVisit = useApp((s) => s.addVisit);
  const { addVisit: apiAddVisit } = useApiVisits();
  
  return {
    mutate: async (data: Omit<Visit, "id"> & { 
      inspectionType: string; 
      notes: string; 
      photos?: { dataUrl: string; caption?: string }[] 
    }) => {
      try {
        // Try API first
        const result = await apiAddVisit(data);
        addVisit(data);
        return result;
      } catch (apiError) {
        // Fallback to mock
        const visit = addVisit(data);
        return visit;
      }
    },
    isPending: false,
  };
}

export function useUpdateVisit() {
  const updateVisit = useApp((s) => s.updateVisit);
  const { updateVisit: apiUpdateVisit } = useApiVisits();
  
  return {
    mutate: async ({ id, updates }: { id: string; updates: Partial<Visit> }) => {
      try {
        // Try API first
        await apiUpdateVisit({ id, updates });
        updateVisit(id, updates);
      } catch (apiError) {
        // Fallback to mock
        updateVisit(id, updates);
      }
    },
    isPending: false,
  };
}

export function useDeleteVisit() {
  const removeVisit = useApp((s) => s.removeVisit);
  const { deleteVisit: apiDeleteVisit } = useApiVisits();
  
  return {
    mutate: async (id: string) => {
      try {
        // Try API first
        await apiDeleteVisit(id);
        removeVisit(id);
      } catch (apiError) {
        // Fallback to mock
        removeVisit(id);
      }
    },
    isPending: false,
  };
}