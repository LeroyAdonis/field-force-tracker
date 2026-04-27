import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "";

// Generic fetcher function with error handling and auth
async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("better-auth.token");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Workers API
export const useWorkers = () => {
  return useQuery({
    queryKey: ["workers"],
    queryFn: () => fetcher<WorkerData[]>("/api/workers"),
  });
};

export const useWorker = (id: string) => {
  return useQuery({
    queryKey: ["worker", id],
    queryFn: () => fetcher<WorkerData>(`/api/workers/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error(`Failed to fetch worker ${id}:`, error);
    },
  });
};

export const useAddWorker = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (workerData: Omit<WorkerData, "id">) =>
      fetcher<WorkerData>("/api/workers", {
        method: "POST",
        body: JSON.stringify(workerData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });

  return { addWorker: mutateAsync };
};

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Worker>;
    }) =>
      fetcher<WorkerData>(`/api/workers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });

  return { updateWorker: mutateAsync };
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (id: string) =>
      fetcher<void>(`/api/workers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    },
  });

  return { deleteWorker: mutateAsync };
};

// Sites API
export const useSites = () => {
  return useQuery({
    queryKey: ["sites"],
    queryFn: () => fetcher<Site[]>("/api/sites"),
  });
};

export const useSite = (id: string) => {
  return useQuery({
    queryKey: ["site", id],
    queryFn: () => fetcher<Site>(`/api/sites/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error(`Failed to fetch site ${id}:`, error);
    },
  });
};

export const useAddSite = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (siteData: Omit<Site, "id">) =>
      fetcher<Site>("/api/sites", {
        method: "POST",
        body: JSON.stringify(siteData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  return { addSite: mutateAsync };
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Site>;
    }) =>
      fetcher<Site>(`/api/sites/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  return { updateSite: mutateAsync };
};

export const useDeleteSite = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (id: string) =>
      fetcher<void>(`/api/sites/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  return { deleteSite: mutateAsync };
};

// Visits API
export const useVisits = () => {
  return useQuery({
    queryKey: ["visits"],
    queryFn: () => fetcher<Visit[]>("/api/visits"),
  });
};

export const useVisit = (id: string) => {
  return useQuery({
    queryKey: ["visit", id],
    queryFn: () => fetcher<Visit>(`/api/visits/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent)
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      console.error(`Failed to fetch visit ${id}:`, error);
    },
  });
};

export const useAddVisit = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (visitData: Omit<Visit, "id">) =>
      fetcher<Visit>("/api/visits", {
        method: "POST",
        body: JSON.stringify(visitData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  return { addVisit: mutateAsync };
};

export const useUpdateVisit = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Visit>;
    }) =>
      fetcher<Visit>(`/api/visits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  return { updateVisit: mutateAsync };
};

export const useDeleteVisit = () => {
  const queryClient = useQueryClient();
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (id: string) =>
      fetcher<void>(`/api/visits/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  return { deleteVisit: mutateAsync };
};

// Auth API
export const useAuth = () => {
  // This hook will be implemented separately
  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    login: async () => {},
    logout: async () => {},
  };
};

export const useLogin = () => {
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: (credentials: { email: string; password: string }) =>
      fetcher<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      localStorage.setItem("better-auth.token", data.token);
      localStorage.setItem("better-auth.user", JSON.stringify(data.user));
    },
  });

  return { login: mutateAsync };
};

export const useLogout = () => {
  const { mutateAsync } = useMutation({
    retry: 3,
    retryDelay: 1000,
    mutationFn: () =>
      fetcher<void>("/api/auth/logout", {
        method: "POST",
      }),
    onSuccess: () => {
      localStorage.removeItem("better-auth.token");
      localStorage.removeItem("better-auth.user");
    },
  });

  return { logout: mutateAsync };
};

// Types (re-export from types.ts for convenience)
export type {
  Worker,
  Site,
  Visit,
  Role,
  RiskStatus,
  Inspection,
  InspectionPhoto,
  KpiTargets,
  SessionUser,
} from "@/lib/types";

// API response types (may differ from internal types)
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

export interface SiteData {
  id: string;
  name: string;
  address: string;
  zone: string;
  active: boolean;
}

export interface VisitData {
  id: string;
  workerId: string;
  siteId: string;
  date: string;
  timestamp: string;
  km: number;
  inspection: {
    id: string;
    type: string;
    notes: string;
    timestamp: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  displayName: string | null;
  avatar: string | null;
  active: boolean;
  userId: string;
  userRoleId: string;
}