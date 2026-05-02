import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  serial,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "worker"]);
export const siteStatusEnum = pgEnum("site_status", ["active", "inactive"]);
export const flagStatusEnum = pgEnum("flag_status", ["green", "amber", "red"]);

// ── Users (Better Auth compatible) ───────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  role: roleEnum("role").default("worker").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Worker Profiles ───────────────────────────────────────────────────────
export const workerProfiles = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  employeeId: text("employee_id"),
  phone: text("phone"),
  region: text("region"),
  // KPI targets (null = use global default)
  dailyVisitTarget: integer("daily_visit_target"),
  dailyKmTarget: real("daily_km_target"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Global KPI Settings ───────────────────────────────────────────────────
export const kpiSettings = pgTable("kpi_settings", {
  id: serial("id").primaryKey(),
  defaultDailyVisitTarget: integer("default_daily_visit_target").default(12).notNull(),
  defaultDailyKmTarget: real("default_daily_km_target").default(100).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by").references(() => users.id),
});

// ── Sites ─────────────────────────────────────────────────────────────────
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  region: text("region"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: siteStatusEnum("status").default("active").notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Site Visits ───────────────────────────────────────────────────────────
export const siteVisits = pgTable("site_visits", {
  id: serial("id").primaryKey(),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id),
  visitDate: text("visit_date").notNull(), // YYYY-MM-DD
  arrivalTime: timestamp("arrival_time"),
  departureTime: timestamp("departure_time"),
  kmCovered: real("km_covered"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Inspections ───────────────────────────────────────────────────────────
export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .references(() => siteVisits.id, { onDelete: "cascade" }),
  workerId: text("worker_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id),
  visitDate: text("visit_date").notNull(),
  inspectionType: text("inspection_type").notNull(),
  findings: text("findings"),
  passed: boolean("passed").default(true),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Daily KPI Snapshots (for flag logic + reporting) ──────────────────────
export const dailyKpiSnapshots = pgTable(
  "daily_kpi_snapshots",
  {
    id: serial("id").primaryKey(),
    workerId: text("worker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    snapshotDate: text("snapshot_date").notNull(), // YYYY-MM-DD
    visitCount: integer("visit_count").default(0).notNull(),
    kmCovered: real("km_covered").default(0).notNull(),
    visitTarget: integer("visit_target").notNull(),
    kmTarget: real("km_target").notNull(),
    visitFlag: flagStatusEnum("visit_flag").default("green").notNull(),
    kmFlag: flagStatusEnum("km_flag").default("green").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.workerId, t.snapshotDate)]
);
