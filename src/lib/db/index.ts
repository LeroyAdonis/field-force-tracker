import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// neon() is a stateless HTTP client — no persistent connections, no event-loop
// hold-open in serverless. Preferred over Pool for short-lived functions.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle({ client: sql, schema: { ...schema, ...relations }, logger: process.env.NODE_ENV === "development" });

export * from "./schema.js";
export * from "./relations.js";
