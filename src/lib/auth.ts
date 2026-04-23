import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}

// Derive site URL: explicit config wins, fall back to Vercel's auto-injected
// deployment URL, then localhost for local dev.
const siteUrl =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:8080");

const trustedOrigins = [
  siteUrl,
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",").filter(Boolean) ?? []),
  "http://localhost:8080",
  "http://localhost:5173",
];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: siteUrl,
  basePath: "/api/auth",
  trustedOrigins,
  // Field mappings: our schema uses legacy NextAuth-style column names.
  // These tell better-auth which DB column each of its internal field names maps to.
  account: {
    fields: {
      accountId: "providerAccountId",
      providerId: "provider",
      accessTokenExpiresAt: "expiresAt",
    },
  },
  verification: {
    fields: {
      value: "token",
      expiresAt: "expires",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURL: `${siteUrl}/api/auth/callback/google`,
    },
  },
});