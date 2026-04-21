import { relations } from "drizzle-orm/relations";
import { visit, inspection, user, userRole, photo, session, invitation, account, worker, site } from "./schema.js";

export const inspectionRelations = relations(inspection, ({one, many}) => ({
	visit: one(visit, {
		fields: [inspection.visitId],
		references: [visit.id]
	}),
	photos: many(photo),
}));

export const visitRelations = relations(visit, ({one, many}) => ({
	inspections: many(inspection),
	worker: one(worker, {
		fields: [visit.workerId],
		references: [worker.id]
	}),
	site: one(site, {
		fields: [visit.siteId],
		references: [site.id]
	}),
}));

export const userRoleRelations = relations(userRole, ({one, many}) => ({
	user: one(user, {
		fields: [userRole.userId],
		references: [user.id]
	}),
	invitations: many(invitation),
	workers: many(worker),
}));

export const userRelations = relations(user, ({many}) => ({
	userRoles: many(userRole),
	sessions: many(session),
	accounts: many(account),
}));

export const photoRelations = relations(photo, ({one}) => ({
	inspection: one(inspection, {
		fields: [photo.inspectionId],
		references: [inspection.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	userRole: one(userRole, {
		fields: [invitation.createdBy],
		references: [userRole.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const workerRelations = relations(worker, ({one, many}) => ({
	visits: many(visit),
	userRole: one(userRole, {
		fields: [worker.userRoleId],
		references: [userRole.id]
	}),
}));

export const siteRelations = relations(site, ({many}) => ({
	visits: many(visit),
}));