import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SiteData {
  id: string;
  name: string;
  address: string;
  zone: string;
  active: boolean;
}

export function useSites() {
  return useQuery<SiteData[]>({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetch("/api/sites");
      if (!response.ok) throw new Error("Failed to fetch sites");
      return response.json();
    },
  });
}

export function useSite(id: string) {
  return useQuery<SiteData>({
    queryKey: ["sites", id],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${id}`);
      if (!response.ok) throw new Error("Failed to fetch site");
      return response.json();
    },
  });
}

export function useAddSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (site: Omit<SiteData, "id">) => {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(site),
      });
      if (!response.ok) throw new Error("Failed to add site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SiteData> }) => {
      const response = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sites/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete site");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}
