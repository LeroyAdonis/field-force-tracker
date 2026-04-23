import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Use pg with the pooler URL (PgBouncer manages connections for serverless).
// connectionTimeoutMillis ensures we fail fast instead of hanging until Vercel's maxDuration.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});

export const db = drizzle({ client: pool, schema: { ...schema, ...relations }, logger: process.env.NODE_ENV === "development" });

export * from "./schema.js";
export * from "./relations.js";