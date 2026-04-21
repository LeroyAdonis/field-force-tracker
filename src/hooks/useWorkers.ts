import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WorkerData {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  avatar: string;
  jobTitle: string;
  dailyKmTarget: number;
  active: boolean;
  isDemo: boolean;
}

export function useWorkers() {
  return useQuery<WorkerData[]>({
    queryKey: ["workers"],
    queryFn: async () => {
      const response = await fetch("/api/workers");
      if (!response.ok) throw new Error("Failed to fetch workers");
      return response.json();
    },
  });
}

export function useWorker(id: string) {
  return useQuery<WorkerData>({
    queryKey: ["workers", id],
    queryFn: async () => {
      const response = await fetch(`/api/workers/${id}`);
      if (!response.ok) throw new Error("Failed to fetch worker");
      return response.json();
    },
  });
}

export function useAddWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (worker: Omit<WorkerData, "id" | "userId">) => {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(worker),
      });
      if (!response.ok) throw new Error("Failed to add worker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<WorkerData> }) => {
      const response = await fetch(`/api/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update worker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/workers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete worker");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });
}
