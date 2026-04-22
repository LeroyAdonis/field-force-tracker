import { useApp } from "@/lib/store";
import { Site } from "@/lib/types";

export function useSites() {
  const sites = useApp((s) => s.sites);
  return { data: sites, isLoading: false, error: null, refetch: () => {} };
}

export function useSite(id: string) {
  const sites = useApp((s) => s.sites);
  return { data: sites.find(s => s.id === id), isLoading: false, error: null };
}

export function useAddSite() {
  const addSite = useApp((s) => s.addSite);
  return { mutate: addSite, isLoading: false };
}

export function useUpdateSite() {
  const updateSite = useApp((s) => s.updateSite);
  return { mutate: ({ id, updates }: { id: string; updates: Partial<Site> }) => updateSite(id, updates), isLoading: false };
}

export function useDeleteSite() {
  const removeSite = useApp((s) => s.removeSite);
  return { mutate: removeSite, isLoading: false };
}
