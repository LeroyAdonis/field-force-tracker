import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import * as schema from "./schema";
import * as relations from "./relations";

// Load environment variables from .env.local
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const db = drizzle(process.env.DATABASE_URL, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export * from "./schema";
export * from "./relations";