import { config } from "dotenv";
config({ path: ".env.local" });

import { db, account } from "./src/lib/db/index.js";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";

const adminHash = await hashPassword("Admin1234!");
const workerHash = await hashPassword("Worker1234!");

await db.update(account).set({ password: adminHash }).where(eq(account.providerAccountId, "admin@kinetic.enterprise"));
await db.update(account).set({ password: workerHash }).where(inArray(account.providerAccountId, ["marcus@kinetic.enterprise", "sarah@kinetic.enterprise"]));

console.log("✓ Passwords updated:");
console.log("  admin@kinetic.enterprise  → Admin1234!");
console.log("  marcus@kinetic.enterprise → Worker1234!");
console.log("  sarah@kinetic.enterprise  → Worker1234!");
