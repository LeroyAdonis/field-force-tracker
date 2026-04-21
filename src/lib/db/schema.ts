import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  varchar,
  jsonb,
  index,
  foreignKey,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: boolean("emailVerified").default(false),
    image: text("image"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    emailIdx: index("user_email_idx").on(table.email),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("account_userId_idx").on(table.userId),
    providerIdx: index("account_provider_idx").on(table.providerId, table.accountId),
  })
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("session_userId_idx").on(table.userId),
    tokenIdx: index("session_token_idx").on(table.token),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

// ============================================================================
// DOMAIN TABLES
// ============================================================================

export const userRole = pgTable(
  "userRole",
  {
    id: text("id").primaryKey(),
    userId: text("userId")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'admin' | 'worker'
    displayName: text("displayName"),
    avatar: text("avatar"),
    active: boolean("active").default(true),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("userRole_userId_idx").on(table.userId),
    roleIdx: index("userRole_role_idx").on(table.role),
  })
);

export const worker = pgTable(
  "worker",
  {
    id: text("id").primaryKey(),
    userRoleId: text("userRoleId")
      .notNull()
      .unique()
      .references(() => userRole.id, { onDelete: "cascade" }),
    jobTitle: text("jobTitle"),
    dailyKmTarget: integer("dailyKmTarget").default(120),
    active: boolean("active").default(true),
    isDemo: boolean("isDemo").default(false),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    userRoleIdIdx: index("worker_userRoleId_idx").on(table.userRoleId),
    isDemoIdx: index("worker_isDemo_idx").on(table.isDemo),
  })
);

export const site = pgTable(
  "site",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    zone: text("zone").notNull(),
    active: boolean("active").default(true),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    nameIdx: index("site_name_idx").on(table.name),
    zoneIdx: index("site_zone_idx").on(table.zone),
  })
);

export const visit = pgTable(
  "visit",
  {
    id: text("id").primaryKey(),
    workerId: text("workerId")
      .notNull()
      .references(() => worker.id, { onDelete: "cascade" }),
    siteId: text("siteId")
      .notNull()
      .references(() => site.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    timestamp: timestamp("timestamp").notNull(),
    km: decimal("km", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    workerIdIdx: index("visit_workerId_idx").on(table.workerId),
    siteIdIdx: index("visit_siteId_idx").on(table.siteId),
    dateIdx: index("visit_date_idx").on(table.date),
  })
);

export const inspection = pgTable(
  "inspection",
  {
    id: text("id").primaryKey(),
    visitId: text("visitId")
      .notNull()
      .references(() => visit.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    notes: text("notes"),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => ({
    visitIdIdx: index("inspection_visitId_idx").on(table.visitId),
  })
);

export const photo = pgTable(
  "photo",
  {
    id: text("id").primaryKey(),
    inspectionId: text("inspectionId")
      .notNull()
      .references(() => inspection.id, { onDelete: "cascade" }),
    dataUrl: text("dataUrl").notNull(),
    caption: text("caption"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    inspectionIdIdx: index("photo_inspectionId_idx").on(table.inspectionId),
  })
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull(), // 'admin' | 'worker'
    createdBy: text("createdBy")
      .notNull()
      .references(() => userRole.id, { onDelete: "restrict" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    emailIdx: index("invitation_email_idx").on(table.email),
    tokenIdx: index("invitation_token_idx").on(table.token),
    createdByIdx: index("invitation_createdBy_idx").on(table.createdBy),
    expiresAtIdx: index("invitation_expiresAt_idx").on(table.expiresAt),
  })
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ one, many }) => ({
  account: many(account),
  session: many(session),
  userRole: one(userRole),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRoleRelations = relations(userRole, ({ one, many }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  worker: one(worker),
  invitationsCreated: many(invitation),
}));

export const workerRelations = relations(worker, ({ one, many }) => ({
  userRole: one(userRole, {
    fields: [worker.userRoleId],
    references: [userRole.id],
  }),
  visits: many(visit),
}));

export const siteRelations = relations(site, ({ many }) => ({
  visits: many(visit),
}));

export const visitRelations = relations(visit, ({ one, many }) => ({
  worker: one(worker, {
    fields: [visit.workerId],
    references: [worker.id],
  }),
  site: one(site, {
    fields: [visit.siteId],
    references: [site.id],
  }),
  inspection: one(inspection),
}));

export const inspectionRelations = relations(inspection, ({ one, many }) => ({
  visit: one(visit, {
    fields: [inspection.visitId],
    references: [visit.id],
  }),
  photos: many(photo),
}));

export const photoRelations = relations(photo, ({ one }) => ({
  inspection: one(inspection, {
    fields: [photo.inspectionId],
    references: [inspection.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  createdByUser: one(userRole, {
    fields: [invitation.createdBy],
    references: [invitation.createdBy],
  }),
}));
