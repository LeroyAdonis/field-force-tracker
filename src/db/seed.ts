import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import { randomUUID } from "crypto";
import { format, subDays } from "date-fns";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log("🌱 Seeding database...");

  const adminId = randomUUID();
  const adminPw = await bcrypt.hash("Admin@123", 10);

  await db.insert(schema.users).values({
    id: adminId, name: "Admin User",
    email: "admin@fieldforce.co.za", emailVerified: true, role: "admin",
  }).onConflictDoNothing();

  await db.insert(schema.accounts).values({
    id: randomUUID(), accountId: adminId,
    providerId: "credential", userId: adminId, password: adminPw,
  }).onConflictDoNothing();

  const workers = [
    { id: randomUUID(), name: "Thabo Nkosi",    email: "thabo@fieldforce.co.za",   region: "Gauteng" },
    { id: randomUUID(), name: "Ayanda Dlamini", email: "ayanda@fieldforce.co.za",  region: "Western Cape" },
    { id: randomUUID(), name: "Sipho Mokoena",  email: "sipho@fieldforce.co.za",   region: "KwaZulu-Natal" },
  ];
  const workerPw = await bcrypt.hash("Worker@123", 10);

  for (const w of workers) {
    await db.insert(schema.users).values({
      id: w.id, name: w.name, email: w.email, emailVerified: true, role: "worker",
    }).onConflictDoNothing();
    await db.insert(schema.accounts).values({
      id: randomUUID(), accountId: w.id, providerId: "credential", userId: w.id, password: workerPw,
    }).onConflictDoNothing();
    await db.insert(schema.workerProfiles).values({
      userId: w.id, region: w.region, employeeId: `EMP${Math.floor(Math.random()*900)+100}`,
    }).onConflictDoNothing();
  }

  await db.insert(schema.kpiSettings).values({
    defaultDailyVisitTarget: 12, defaultDailyKmTarget: 100, updatedBy: adminId,
  }).onConflictDoNothing();

  const siteData = [
    { name: "Sandton CBD Hub",            address: "Sandton Drive, Sandton",       region: "Gauteng" },
    { name: "Soweto Distribution Centre", address: "Old Potch Rd, Soweto",         region: "Gauteng" },
    { name: "Pretoria East Office",       address: "Lynnwood Rd, Pretoria",        region: "Gauteng" },
    { name: "Midrand Logistics Park",     address: "New Rd, Midrand",              region: "Gauteng" },
    { name: "Cape Town Waterfront Site",  address: "V&A Waterfront, Cape Town",    region: "Western Cape" },
    { name: "Bellville Industrial",       address: "Voortrekker Rd, Bellville",    region: "Western Cape" },
    { name: "Durban Port Facility",       address: "Bayhead Rd, Durban",           region: "KwaZulu-Natal" },
    { name: "Umhlanga Office Park",       address: "Umhlanga Ridge, Umhlanga",     region: "KwaZulu-Natal" },
  ];

  const insertedSites: number[] = [];
  for (const s of siteData) {
    const [site] = await db.insert(schema.sites).values({ ...s, createdBy: adminId }).returning();
    insertedSites.push(site.id);
  }

  const inspectionTypes = ["Safety Check","Quality Audit","Equipment Inspection","Compliance Check","Routine Visit"];
  for (const worker of workers) {
    for (let d = 6; d >= 0; d--) {
      const date = format(subDays(new Date(), d), "yyyy-MM-dd");
      const count = Math.floor(Math.random() * 6) + 3;
      const usedSites = [...insertedSites].sort(() => Math.random()-0.5).slice(0, count);
      for (const siteId of usedSites) {
        const [visit] = await db.insert(schema.siteVisits).values({
          workerId: worker.id, siteId, visitDate: date,
          arrivalTime: new Date(`${date}T0${7+Math.floor(Math.random()*4)}:00:00`),
          departureTime: new Date(`${date}T${11+Math.floor(Math.random()*6)}:00:00`),
          kmCovered: parseFloat((Math.random()*20+5).toFixed(1)),
          notes: Math.random()>0.6 ? "All checks completed satisfactorily." : null,
        }).returning();
        if (Math.random()>0.4) {
          await db.insert(schema.inspections).values({
            visitId: visit.id, workerId: worker.id, siteId, visitDate: date,
            inspectionType: inspectionTypes[Math.floor(Math.random()*inspectionTypes.length)],
            findings: "No issues found.", passed: Math.random()>0.15,
          });
        }
      }
    }
  }

  console.log("✅ Seed complete!");
  console.log("Admin:    admin@fieldforce.co.za / Admin@123");
  console.log("Worker:   thabo@fieldforce.co.za / Worker@123");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
