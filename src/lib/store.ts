import { create } from "zustand";
import { Role, Site, Visit, Worker } from "./types";
import { admin, DEFAULT_DAILY_VISITS, sites as seedSites, visits as seedVisits, workers as seedWorkers } from "./mock-data";
import { useAuth } from "@/hooks/useAuth";

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
}

const userFromWorker = (w: Worker): SessionUser => ({
  id: w.id,
  name: w.name,
  email: w.email,
  avatar: w.avatar,
  role: "worker",
  title: w.role,
});

const adminUser: SessionUser = {
  id: admin.id,
  name: admin.name,
  email: admin.email,
  avatar: admin.avatar,
  role: "admin",
  title: admin.role,
};

export const useApp = create<AppState>((set, get) => ({
  user: null,
  workers: seedWorkers,
  sites: seedSites,
  visits: seedVisits,
  dailyVisitsTarget: DEFAULT_DAILY_VISITS,

  setUser: (user) => set({ user }),

  loginAs: async (role, workerId) => {
    // This is now a wrapper for the real auth system
    // For backward compatibility during transition
    if (role === "admin") {
      set({ user: adminUser });
      return;
    }
    
    const w = get().workers.find(x => x.id === workerId) ?? get().workers[0];
    set({ user: userFromWorker(w) });
  },

  logout: () => set({ user: null }),

  addVisit: ({ workerId, siteId, date, timestamp, km, inspectionType, notes, photos }) => {
    const id = `v${Date.now()}`;
    const visit: Visit = {
      id,
      workerId,
      siteId,
      date,
      timestamp,
      km,
      inspection: {
        id: `i${Date.now()}`,
        visitId: id,
        type: inspectionType,
        notes,
        timestamp,
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
}));