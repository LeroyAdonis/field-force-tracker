import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "./schema.js";
import * as relations from "./relations.js";

// Load environment variables from .env.local
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = drizzle(process.env.DATABASE_URL, {
  schema: { ...schema, ...relations },
  logger: process.env.NODE_ENV === "development",
});

export * from "./schema.js";
export * from "./relations.js";