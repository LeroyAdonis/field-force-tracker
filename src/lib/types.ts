export type Role = "admin" | "worker";

export type RiskStatus = "on-track" | "at-risk" | "missing";

export interface Site {
  id: string;
  name: string;
  address: string;
  zone: string;
  active: boolean;
}

export interface Worker {
  id: string;
  name: string;
  email: string;
  role: string; // job title (e.g., "Lead Inspector")
  avatar: string;
  dailyKmTarget: number; // configurable per worker
  active: boolean;
}

export interface InspectionPhoto {
  id: string;
  dataUrl: string;       // base64 data URL (UI-only scaffold)
  caption?: string;
}

export interface Inspection {
  id: string;
  visitId: string;
  type: string;          // e.g., "Structural Audit"
  notes: string;
  timestamp: string;     // ISO
  photos?: InspectionPhoto[];
}

export interface Visit {
  id: string;
  workerId: string;
  siteId: string;
  date: string;          // ISO date (YYYY-MM-DD)
  timestamp: string;     // ISO datetime
  km: number;
  inspection: Inspection;
}

export interface KpiTargets {
  dailyVisits: number;
  dailyKm: number;
}
