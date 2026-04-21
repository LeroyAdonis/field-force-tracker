DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "account_provider_idx";--> statement-breakpoint
DROP INDEX "inspection_visitId_idx";--> statement-breakpoint
DROP INDEX "invitation_email_idx";--> statement-breakpoint
DROP INDEX "invitation_token_idx";--> statement-breakpoint
DROP INDEX "invitation_createdBy_idx";--> statement-breakpoint
DROP INDEX "invitation_expiresAt_idx";--> statement-breakpoint
DROP INDEX "photo_inspectionId_idx";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_idx";--> statement-breakpoint
DROP INDEX "site_name_idx";--> statement-breakpoint
DROP INDEX "site_zone_idx";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
DROP INDEX "userRole_userId_idx";--> statement-breakpoint
DROP INDEX "userRole_role_idx";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "visit_workerId_idx";--> statement-breakpoint
DROP INDEX "visit_siteId_idx";--> statement-breakpoint
DROP INDEX "visit_date_idx";--> statement-breakpoint
DROP INDEX "worker_userRoleId_idx";--> statement-breakpoint
DROP INDEX "worker_isDemo_idx";--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "account_provider_idx" ON "account" USING btree ("provider" text_ops,"providerAccountId" text_ops);--> statement-breakpoint
CREATE INDEX "inspection_visitId_idx" ON "inspection" USING btree ("visitId" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitation" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_createdBy_idx" ON "invitation" USING btree ("createdBy" text_ops);--> statement-breakpoint
CREATE INDEX "invitation_expiresAt_idx" ON "invitation" USING btree ("expiresAt" timestamp_ops);--> statement-breakpoint
CREATE INDEX "photo_inspectionId_idx" ON "photo" USING btree ("inspectionId" text_ops);--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "site_name_idx" ON "site" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "site_zone_idx" ON "site" USING btree ("zone" text_ops);--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "userRole_userId_idx" ON "userRole" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE INDEX "userRole_role_idx" ON "userRole" USING btree ("role" text_ops);--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX "visit_workerId_idx" ON "visit" USING btree ("workerId" text_ops);--> statement-breakpoint
CREATE INDEX "visit_siteId_idx" ON "visit" USING btree ("siteId" text_ops);--> statement-breakpoint
CREATE INDEX "visit_date_idx" ON "visit" USING btree ("date" text_ops);--> statement-breakpoint
CREATE INDEX "worker_userRoleId_idx" ON "worker" USING btree ("userRoleId" text_ops);--> statement-breakpoint
CREATE INDEX "worker_isDemo_idx" ON "worker" USING btree ("isDemo" bool_ops);