import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PhotoData {
  id: string;
  dataUrl: string;
  caption: string | null;
}

export interface InspectionData {
  id: string;
  type: string;
  notes: string | null;
  timestamp: string;
  photos: PhotoData[];
}

export interface VisitData {
  id: string;
  workerId: string;
  workerName: string;
  siteId: string;
  siteName: string;
  date: string;
  timestamp: string;
  km: string | number;
  inspection: InspectionData | null;
  createdAt: string;
  updatedAt: string;
}

export function useVisits() {
  return useQuery<VisitData[]>({
    queryKey: ["visits"],
    queryFn: async () => {
      const response = await fetch("/api/visits");
      if (!response.ok) throw new Error("Failed to fetch visits");
      return response.json();
    },
  });
}

export function useVisit(id: string) {
  return useQuery<VisitData>({
    queryKey: ["visits", id],
    queryFn: async () => {
      const response = await fetch(`/api/visits/${id}`);
      if (!response.ok) throw new Error("Failed to fetch visit");
      return response.json();
    },
  });
}

export function useAddVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (visit: {
      workerId: string;
      siteId: string;
      date: string;
      km: number | string;
      inspectionType?: string;
      notes?: string;
      photos?: { dataUrl: string; caption?: string }[];
    }) => {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(visit),
      });
      if (!response.ok) throw new Error("Failed to add visit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VisitData> }) => {
      const response = await fetch(`/api/visits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update visit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}

export function useDeleteVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/visits/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete visit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
