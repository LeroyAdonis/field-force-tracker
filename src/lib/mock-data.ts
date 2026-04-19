import { Site, Worker, Visit, Inspection } from "./types";

export const DEFAULT_DAILY_VISITS = 12;
export const DEFAULT_DAILY_KM = 60;

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const at = (offsetDays: number, hour = 9, minute = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const dateOf = (offsetDays: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offsetDays);
  return iso(d);
};

export const sites: Site[] = [
  { id: "s1", name: "North Creek Terminal", address: "120 Harbor Way", zone: "North", active: true },
  { id: "s2", name: "Bridge View Site", address: "44 Riverside Dr", zone: "Central", active: true },
  { id: "s3", name: "Central Plaza Phase 1", address: "8 Market Sq", zone: "Central", active: true },
  { id: "s4", name: "The Heights Residency", address: "210 Hilltop Rd", zone: "South", active: true },
  { id: "s5", name: "Riverfront Lofts", address: "67 Quay Lane", zone: "East", active: true },
  { id: "s6", name: "Sector 7G Substation", address: "7G Industrial Park", zone: "West", active: true },
  { id: "s7", name: "Old Mill Conversion", address: "33 Mill St", zone: "North", active: true },
  { id: "s8", name: "Civic Library Annex", address: "1 Civic Blvd", zone: "Central", active: true },
  { id: "s9", name: "South Wharf Depot", address: "9 Dock Rd", zone: "South", active: false },
  { id: "s10", name: "Greenfield Logistics Hub", address: "55 Outer Ring", zone: "West", active: true },
];

export const workers: Worker[] = [
  {
    id: "w1",
    name: "Marcus Kane",
    email: "marcus@kinetic.enterprise",
    role: "Lead Inspector",
    avatar: "https://i.pravatar.cc/120?img=12",
    dailyKmTarget: 60,
    active: true,
  },
  {
    id: "w2",
    name: "Sarah Miller",
    email: "sarah@kinetic.enterprise",
    role: "Senior Surveyor",
    avatar: "https://i.pravatar.cc/120?img=47",
    dailyKmTarget: 75,
    active: true,
  },
  {
    id: "w3",
    name: "David Chen",
    email: "david@kinetic.enterprise",
    role: "Site Foreman",
    avatar: "https://i.pravatar.cc/120?img=15",
    dailyKmTarget: 50,
    active: true,
  },
  {
    id: "w4",
    name: "James Wilson",
    email: "james@kinetic.enterprise",
    role: "Field Inspector",
    avatar: "https://i.pravatar.cc/120?img=33",
    dailyKmTarget: 60,
    active: true,
  },
];

export const admin = {
  id: "a1",
  name: "Eleanor Vance",
  email: "admin@kinetic.enterprise",
  role: "Operations Director",
  avatar: "https://i.pravatar.cc/120?img=5",
};

const inspectionTypes = [
  "Structural Audit",
  "Safety Inspection",
  "Compliance Check",
  "Foundation Review",
  "Electrical Survey",
];

let visitCounter = 0;
const mkVisit = (workerId: string, siteId: string, dayOffset: number, hour: number, km: number, type: string, notes: string): Visit => {
  visitCounter++;
  const id = `v${visitCounter}`;
  const ts = at(dayOffset, hour, Math.floor(Math.random() * 50));
  const inspection: Inspection = {
    id: `i${visitCounter}`,
    visitId: id,
    type,
    notes,
    timestamp: ts,
  };
  return { id, workerId, siteId, date: dateOf(dayOffset), timestamp: ts, km, inspection };
};

// Today: Marcus 8/12 (at risk later in day), Sarah 4/12 (high risk),
// David 10/12 (on track), James 12/12 (on track)
const todayVisits: Visit[] = [
  // Marcus — 8 visits today
  ...Array.from({ length: 8 }).map((_, i) =>
    mkVisit("w1", sites[i % sites.length].id, 0, 7 + i, 6 + (i % 3), inspectionTypes[i % inspectionTypes.length],
      "Routine inspection completed. No critical findings.")
  ),
  // Sarah — only 4 visits today (very behind)
  ...Array.from({ length: 4 }).map((_, i) =>
    mkVisit("w2", sites[(i + 1) % sites.length].id, 0, 8 + i * 2, 9 + i, inspectionTypes[(i + 2) % inspectionTypes.length],
      "Awaiting site access for additional units.")
  ),
  // David — 10 visits today
  ...Array.from({ length: 10 }).map((_, i) =>
    mkVisit("w3", sites[(i + 2) % sites.length].id, 0, 7 + Math.floor(i * 0.8), 5 + (i % 2), inspectionTypes[(i + 1) % inspectionTypes.length],
      "Foreman walkthrough; punch list updated.")
  ),
  // James — 12 visits today (on track)
  ...Array.from({ length: 12 }).map((_, i) =>
    mkVisit("w4", sites[(i + 3) % sites.length].id, 0, 6 + Math.floor(i * 0.7), 4 + (i % 3), inspectionTypes[(i + 3) % inspectionTypes.length],
      "All clear. Photos uploaded to record.")
  ),
];

const previousVisits: Visit[] = [];
for (let day = 1; day <= 28; day++) {
  for (const w of workers) {
    const base = w.id === "w2" ? 7 : w.id === "w1" ? 11 : 12;
    const count = Math.max(2, base + Math.round(Math.sin(day) * 2));
    for (let v = 0; v < count; v++) {
      previousVisits.push(
        mkVisit(w.id, sites[(day + v) % sites.length].id, day, 7 + v, 4 + (v % 5),
          inspectionTypes[(day + v) % inspectionTypes.length],
          "Inspection logged on schedule.")
      );
    }
  }
}

export const visits: Visit[] = [...todayVisits, ...previousVisits];

export const todayISO = iso(today);
