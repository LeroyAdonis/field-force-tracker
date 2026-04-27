import { useApp } from "@/lib/store";
import { Worker } from "@/lib/types";
import { useWorkers as useApiWorkers } from "@/lib/api";

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
  // Try to use API first, fallback to Zustand store if API fails
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useApiWorkers();
  const workers = useApp((s) => s.workers);
  
  // If we have API data and no error, use it
  if (apiData !== undefined && !apiError) {
    return { 
      data: apiData, 
      isLoading: apiLoading, 
      error: null, 
      refetch: apiRefetch 
    };
  }
  
  // Otherwise fallback to Zustand store
  return { 
    data: workers.map(mapWorker), 
    isLoading: false, 
    error: null, 
    refetch: () => {} 
  };
}

export function useWorker(id: string) {
  const { data: apiData, isLoading: apiLoading, error: apiError, refetch: apiRefetch } = useApiWorkers();
  const workers = useApp((s) => s.workers);
  const worker = workers.find(w => w.id === id);
  
  if (apiData !== undefined && !apiError) {
    const workerData = apiData.find(w => w.id === id);
    return { 
      data: workerData ? mapWorker(workerData) : undefined, 
      isLoading: apiLoading, 
      error: apiError, 
      refetch: apiRefetch 
    };
  }
  
  return { 
    data: worker ? mapWorker(worker) : undefined, 
    isLoading: false, 
    error: null, 
    refetch: () => {} 
  };
}

export function useAddWorker() {
  const addWorker = useApp((s) => s.addWorker);
  const { addWorker: apiAddWorker } = useApiWorkers();
  
  return {
    mutate: async (data: Omit<WorkerData, "id" | "userId" | "isDemo">) => {
      try {
        // Try API first
        const result = await apiAddWorker(data);
        addWorker({
          name: result.displayName,
          email: result.email,
          role: result.jobTitle,
          avatar: result.avatar,
          dailyKmTarget: result.dailyKmTarget,
          active: result.active,
        });
        return result;
      } catch (apiError) {
        // Fallback to mock
        const worker: Worker = { 
          ...data, 
          id: `w${Date.now()}` 
        };
        addWorker(worker);
        return worker;
      }
    },
    isPending: false,
  };
}

export function useUpdateWorker() {
  const updateWorker = useApp((s) => s.updateWorker);
  const { updateWorker: apiUpdateWorker } = useApiWorkers();
  
  return {
    mutate: async ({ id, updates }: { id: string; updates: Partial<Worker> }) => {
      try {
        // Try API first
        await apiUpdateWorker({ id, updates });
        updateWorker(id, updates);
      } catch (apiError) {
        // Fallback to mock
        updateWorker(id, updates);
      }
    },
    isPending: false,
  };
}

export function useDeleteWorker() {
  const removeWorker = useApp((s) => s.removeWorker);
  const { deleteWorker: apiDeleteWorker } = useApiWorkers();
  
  return {
    mutate: async (id: string) => {
      try {
        // Try API first
        await apiDeleteWorker(id);
        removeWorker(id);
      } catch (apiError) {
        // Fallback to mock
        removeWorker(id);
      }
    },
    isPending: false,
  };
}