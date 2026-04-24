import { useApp } from "@/lib/store";
import { Worker } from "@/lib/types";

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

const mapWorker = (w: Worker): WorkerData => ({
  id: w.id,
  userId: w.id,
  email: w.email,
  displayName: w.name,
  avatar: w.avatar,
  jobTitle: w.role,
  dailyKmTarget: w.dailyKmTarget,
  active: w.active,
  isDemo: false,
});

export function useWorkers() {
  const workers = useApp((s) => s.workers);
  return { data: workers.map(mapWorker), isLoading: false, error: null, refetch: () => {} };
}

export function useWorker(id: string) {
  const workers = useApp((s) => s.workers);
  const worker = workers.find(w => w.id === id);
  return { data: worker ? mapWorker(worker) : undefined, isLoading: false, error: null };
}

export function useAddWorker() {
  const addWorker = useApp((s) => s.addWorker);
  return {
    mutate: async (data: Omit<WorkerData, "id" | "userId" | "isDemo">) => {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add worker");
      }
      const created = await res.json();
      addWorker({
        name: created.displayName,
        email: created.email,
        role: created.jobTitle,
        avatar: created.avatar,
        dailyKmTarget: created.dailyKmTarget,
        active: created.active,
      });
    },
    isPending: false,
  };
}

export function useUpdateWorker() {
  const updateWorker = useApp((s) => s.updateWorker);
  return {
    mutate: async ({ id, updates }: { id: string; updates: Partial<Worker> }) => {
      const res = await fetch(`/api/workers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update worker");
      }
      updateWorker(id, updates);
    },
    isPending: false,
  };
}

export function useDeleteWorker() {
  const removeWorker = useApp((s) => s.removeWorker);
  return {
    mutate: async (id: string) => {
      const res = await fetch(`/api/workers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete worker");
      }
      removeWorker(id);
    },
    isPending: false,
  };
}
