CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspection" (
	"id" text PRIMARY KEY NOT NULL,
	"visitId" text NOT NULL,
	"type" text NOT NULL,
	"notes" text,
	"timestamp" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"createdBy" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "photo" (
	"id" text PRIMARY KEY NOT NULL,
	"inspectionId" text NOT NULL,
	"dataUrl" text NOT NULL,
	"caption" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"zone" text NOT NULL,
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" boolean DEFAULT false,
	"image" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "userRole" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"displayName" text,
	"avatar" text,
	"active" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "userRole_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "verification_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "visit" (
	"id" text PRIMARY KEY NOT NULL,
	"workerId" text NOT NULL,
	"siteId" text NOT NULL,
	"date" varchar(10) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"km" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "worker" (
	"id" text PRIMARY KEY NOT NULL,
	"userRoleId" text NOT NULL,
	"jobTitle" text,
	"dailyKmTarget" integer DEFAULT 120,
	"active" boolean DEFAULT true,
	"isDemo" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "worker_userRoleId_unique" UNIQUE("userRoleId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection" ADD CONSTRAINT "inspection_visitId_visit_id_fk" FOREIGN KEY ("visitId") REFERENCES "public"."visit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_createdBy_userRole_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."userRole"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo" ADD CONSTRAINT "photo_inspectionId_inspection_id_fk" FOREIGN KEY ("inspectionId") REFERENCES "public"."inspection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userRole" ADD CONSTRAINT "userRole_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_workerId_worker_id_fk" FOREIGN KEY ("workerId") REFERENCES "public"."worker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit" ADD CONSTRAINT "visit_siteId_site_id_fk" FOREIGN KEY ("siteId") REFERENCES "public"."site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker" ADD CONSTRAINT "worker_userRoleId_userRole_id_fk" FOREIGN KEY ("userRoleId") REFERENCES "public"."userRole"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "account_provider_idx" ON "account" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "inspection_visitId_idx" ON "inspection" USING btree ("visitId");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitation_token_idx" ON "invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitation_createdBy_idx" ON "invitation" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "invitation_expiresAt_idx" ON "invitation" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "photo_inspectionId_idx" ON "photo" USING btree ("inspectionId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "site_name_idx" ON "site" USING btree ("name");--> statement-breakpoint
CREATE INDEX "site_zone_idx" ON "site" USING btree ("zone");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "userRole_userId_idx" ON "userRole" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userRole_role_idx" ON "userRole" USING btree ("role");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "visit_workerId_idx" ON "visit" USING btree ("workerId");--> statement-breakpoint
CREATE INDEX "visit_siteId_idx" ON "visit" USING btree ("siteId");--> statement-breakpoint
CREATE INDEX "visit_date_idx" ON "visit" USING btree ("date");--> statement-breakpoint
CREATE INDEX "worker_userRoleId_idx" ON "worker" USING btree ("userRoleId");--> statement-breakpoint
CREATE INDEX "worker_isDemo_idx" ON "worker" USING btree ("isDemo");