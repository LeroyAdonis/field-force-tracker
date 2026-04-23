import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { config } from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

config({ path: ".env.local" });

// poolQueryViaFetch: route all Pool queries through Neon's HTTP API.
// This avoids TCP SCRAM-SHA-256-PLUS (channel_binding) auth which hangs with
// pg against Neon's PgBouncer, and avoids WebSocket keep-alive issues in
// short-lived serverless functions. Neon's recommended approach for Vercel.
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, schema: { ...schema, ...relations }, logger: process.env.NODE_ENV === "development" });

export * from "./schema.js";
export * from "./relations.js";
