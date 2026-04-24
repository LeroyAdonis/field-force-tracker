import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Role, Site, Visit, Worker } from "./types";
import { admin, DEFAULT_DAILY_VISITS, sites as seedSites, visits as seedVisits, workers as seedWorkers } from "./mock-data";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  title: string;
  workerId?: string;
  dailyKmTarget?: number;
}

interface AppState {
  user: SessionUser | null;
  workers: Worker[];
  sites: Site[];
  visits: Visit[];
  dailyVisitsTarget: number;

  setUser: (user: SessionUser | null) => void;
  loginAs: (role: Role, workerId?: string) => void;
  logout: () => void;

  addVisit: (v: Omit<Visit, "id" | "inspection"> & { inspectionType: string; notes: string; photos?: { dataUrl: string; caption?: string }[] }) => void;
  removeVisit: (visitId: string) => void;
  updateVisit: (visitId: string, updates: Partial<Visit>) => void;
  addSite: (s: Omit<Site, "id">) => Site;
  updateSite: (id: string, patch: Partial<Site>) => void;
  removeSite: (id: string) => void;

  addWorker: (w: Omit<Worker, "id">) => void;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  removeWorker: (id: string) => void;

  setDailyVisitsTarget: (n: number) => void;
}

const userFromWorker = (w: Worker): SessionUser => ({
  id: w.id, name: w.name, email: w.email, avatar: w.avatar, role: "worker", title: w.role,
});
const adminUser: SessionUser = {
  id: admin.id, name: admin.name, email: admin.email, avatar: admin.avatar, role: "admin", title: admin.role,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      workers: seedWorkers,
      sites: seedSites,
      visits: seedVisits,
      dailyVisitsTarget: DEFAULT_DAILY_VISITS,

  setUser: (user) => set({ user }),
  loginAs: (role, workerId) => {
    if (role === "admin") return set({ user: adminUser });
    const w = get().workers.find(x => x.id === workerId) ?? get().workers[0];
    set({ user: userFromWorker(w) });
  },
  logout: () => set({ user: null }),

  addVisit: ({ workerId, siteId, date, timestamp, km, inspectionType, notes, photos }) => {
    const id = `v${Date.now()}`;
    const visit: Visit = {
      id, workerId, siteId, date, timestamp, km,
      inspection: {
        id: `i${Date.now()}`, visitId: id, type: inspectionType, notes, timestamp,
        photos: photos?.map((p, idx) => ({ id: `p${Date.now()}_${idx}`, dataUrl: p.dataUrl, caption: p.caption })),
      },
    };
    set({ visits: [visit, ...get().visits] });
  },

  removeVisit: (visitId) => set({ visits: get().visits.filter(v => v.id !== visitId) }),
  updateVisit: (visitId, updates) =>
    set({ visits: get().visits.map(v => (v.id === visitId ? { ...v, ...updates } : v)) }),

  addSite: (s) => {
    const site: Site = { ...s, id: `s${Date.now()}` };
    set({ sites: [...get().sites, site] });
    return site;
  },
  updateSite: (id, patch) =>
    set({ sites: get().sites.map(s => (s.id === id ? { ...s, ...patch } : s)) }),
  removeSite: (id) => set({ sites: get().sites.filter(s => s.id !== id) }),

  addWorker: (w) => {
    const worker: Worker = { ...w, id: `w${Date.now()}` };
    set({ workers: [...get().workers, worker] });
  },
  updateWorker: (id, patch) =>
    set({ workers: get().workers.map(w => (w.id === id ? { ...w, ...patch } : w)) }),
  removeWorker: (id) => set({ workers: get().workers.filter(w => w.id !== id) }),

      setDailyVisitsTarget: (n) => set({ dailyVisitsTarget: n }),
    }),
    {
      name: "fft-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        workers: s.workers,
        sites: s.sites,
        visits: s.visits,
        dailyVisitsTarget: s.dailyVisitsTarget,
      }),
    }
  )
);
