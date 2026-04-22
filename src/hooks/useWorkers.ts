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
  userId: w.id, // Assuming same for now
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
  return { mutate: (worker: Omit<Worker, "id">) => addWorker(worker), isLoading: false };
}

export function useUpdateWorker() {
  const updateWorker = useApp((s) => s.updateWorker);
  return { mutate: ({ id, updates }: { id: string; updates: Partial<Worker> }) => updateWorker(id, updates), isLoading: false };
}

export function useDeleteWorker() {
  const removeWorker = useApp((s) => s.removeWorker);
  return { mutate: removeWorker, isLoading: false };
}
