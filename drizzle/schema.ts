import { pgTable, index, foreignKey, text, timestamp, unique, boolean, varchar, numeric, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const inspection = pgTable("inspection", {
	id: text().primaryKey().notNull(),
	visitId: text().notNull(),
	type: text().notNull(),
	notes: text(),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("inspection_visitId_idx").using("btree", table.visitId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.visitId],
			foreignColumns: [visit.id],
			name: "inspection_visitId_visit_id_fk"
		}).onDelete("cascade"),
]);

export const userRole = pgTable("userRole", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	role: text().notNull(),
	displayName: text(),
	avatar: text(),
	active: boolean().default(true),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("userRole_role_idx").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("userRole_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "userRole_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("userRole_userId_unique").on(table.userId),
]);

export const photo = pgTable("photo", {
	id: text().primaryKey().notNull(),
	inspectionId: text().notNull(),
	dataUrl: text().notNull(),
	caption: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("photo_inspectionId_idx").using("btree", table.inspectionId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.inspectionId],
			foreignColumns: [inspection.id],
			name: "photo_inspectionId_inspection_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	token: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("session_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const site = pgTable("site", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	zone: text().notNull(),
	active: boolean().default(true),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("site_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("site_zone_idx").using("btree", table.zone.asc().nullsLast().op("text_ops")),
]);

export const invitation = pgTable("invitation", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	role: text().notNull(),
	createdBy: text().notNull(),
	token: text().notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("invitation_createdBy_idx").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("invitation_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitation_expiresAt_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("invitation_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [userRole.id],
			name: "invitation_createdBy_userRole_id_fk"
		}).onDelete("restrict"),
	unique("invitation_token_unique").on(table.token),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
	unique("verification_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: boolean().default(false),
	image: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("account_provider_idx").using("btree", table.provider.asc().nullsLast().op("text_ops"), table.providerAccountId.asc().nullsLast().op("text_ops")),
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_user_id_fk"
		}).onDelete("cascade"),
]);

export const visit = pgTable("visit", {
	id: text().primaryKey().notNull(),
	workerId: text().notNull(),
	siteId: text().notNull(),
	date: varchar({ length: 10 }).notNull(),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	km: numeric({ precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("visit_date_idx").using("btree", table.date.asc().nullsLast().op("text_ops")),
	index("visit_siteId_idx").using("btree", table.siteId.asc().nullsLast().op("text_ops")),
	index("visit_workerId_idx").using("btree", table.workerId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.workerId],
			foreignColumns: [worker.id],
			name: "visit_workerId_worker_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.siteId],
			foreignColumns: [site.id],
			name: "visit_siteId_site_id_fk"
		}).onDelete("cascade"),
]);

export const worker = pgTable("worker", {
	id: text().primaryKey().notNull(),
	userRoleId: text().notNull(),
	jobTitle: text(),
	dailyKmTarget: integer().default(120),
	active: boolean().default(true),
	isDemo: boolean().default(false),
	createdAt: timestamp({ mode: 'string' }).defaultNow(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	index("worker_isDemo_idx").using("btree", table.isDemo.asc().nullsLast().op("bool_ops")),
	index("worker_userRoleId_idx").using("btree", table.userRoleId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userRoleId],
			foreignColumns: [userRole.id],
			name: "worker_userRoleId_userRole_id_fk"
		}).onDelete("cascade"),
	unique("worker_userRoleId_unique").on(table.userRoleId),
]);
