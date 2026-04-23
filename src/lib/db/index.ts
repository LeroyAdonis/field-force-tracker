import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

config({ path: ".env.local" });

// neon-http uses Neon's HTTP API — requires the direct (unpooled) URL, not the pooler URL
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(connectionString);

export const db = drizzle({ client: sql, schema: { ...schema, ...relations }, logger: process.env.NODE_ENV === "development" });

export * from "./schema.js";
export * from "./relations.js";