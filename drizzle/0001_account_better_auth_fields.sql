-- Migration: Align account table with Better Auth v1 expected field names
-- Renames provider→providerId, providerAccountId→accountId, expiresAt→accessTokenExpiresAt
-- Drops type column (not used by Better Auth)
-- Adds password, updatedAt, idToken, scope, refreshTokenExpiresAt

ALTER TABLE "account" RENAME COLUMN "provider" TO "providerId";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "providerAccountId" TO "accountId";--> statement-breakpoint
ALTER TABLE "account" RENAME COLUMN "expiresAt" TO "accessTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN IF EXISTS "type";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "password" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
DROP INDEX IF EXISTS "account_provider_idx";--> statement-breakpoint
CREATE INDEX "account_provider_idx" ON "account" USING btree ("providerId","accountId");
