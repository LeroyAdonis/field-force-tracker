import { config } from "dotenv";
config({ path: ".env.local" });

import { db, user, account, userRole, worker, site, visit, inspection } from "./index.js";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Idempotent: skip if already seeded
  const existing = await db.query.user.findFirst({ where: eq(user.email, "admin@kinetic.enterprise") });
  if (existing) {
    console.log("Already seeded — skipping. (Delete admin@kinetic.enterprise to re-seed.)");
    process.exit(0);
  }

  const now = new Date().toISOString();
  const adminPassword = await hashPassword("Admin1234!");
  const workerPassword = await hashPassword("Worker1234!");

  // ── Admin ──────────────────────────────────────────────────────────────────
  const ADMIN_ID = "user_admin_demo";
  await db.insert(user).values({ id: ADMIN_ID, name: "Eleanor Vance", email: "admin@kinetic.enterprise", emailVerified: true, createdAt: now, updatedAt: now });
  await db.insert(account).values({ id: "account_admin_demo", userId: ADMIN_ID, type: "email", provider: "credential", providerAccountId: "admin@kinetic.enterprise", password: adminPassword, createdAt: now });
  await db.insert(userRole).values({ id: "role_admin_demo", userId: ADMIN_ID, role: "admin", displayName: "Eleanor Vance", avatar: "https://i.pravatar.cc/120?img=5", active: true, createdAt: now, updatedAt: now });
  console.log("  ✓ Admin user created");

  // ── Workers ────────────────────────────────────────────────────────────────
  const workerDefs = [
    { userId: "user_marcus_demo", roleId: "role_marcus_demo", workerId: "worker_marcus_demo", name: "Marcus Kane", email: "marcus@kinetic.enterprise", jobTitle: "Lead Inspector", dailyKmTarget: 60, avatar: "https://i.pravatar.cc/120?img=12" },
    { userId: "user_sarah_demo", roleId: "role_sarah_demo", workerId: "worker_sarah_demo", name: "Sarah Miller", email: "sarah@kinetic.enterprise", jobTitle: "Senior Surveyor", dailyKmTarget: 75, avatar: "https://i.pravatar.cc/120?img=47" },
  ];

  for (const def of workerDefs) {
    await db.insert(user).values({ id: def.userId, name: def.name, email: def.email, emailVerified: true, createdAt: now, updatedAt: now });
    await db.insert(account).values({ id: `account_${def.userId}`, userId: def.userId, type: "email", provider: "credential", providerAccountId: def.email, password: workerPassword, createdAt: now });
    await db.insert(userRole).values({ id: def.roleId, userId: def.userId, role: "worker", displayName: def.name, avatar: def.avatar, active: true, createdAt: now, updatedAt: now });
    await db.insert(worker).values({ id: def.workerId, userRoleId: def.roleId, jobTitle: def.jobTitle, dailyKmTarget: def.dailyKmTarget, active: true, isDemo: true, createdAt: now, updatedAt: now });
  }
  console.log("  ✓ 2 demo workers created");

  // ── Sites ──────────────────────────────────────────────────────────────────
  const siteDefs = [
    { id: "site_1", name: "North Creek Terminal", address: "120 Harbor Way", zone: "North", active: true },
    { id: "site_2", name: "Bridge View Site", address: "44 Riverside Dr", zone: "Central", active: true },
    { id: "site_3", name: "Central Plaza Phase 1", address: "8 Market Sq", zone: "Central", active: true },
    { id: "site_4", name: "The Heights Residency", address: "210 Hilltop Rd", zone: "South", active: true },
    { id: "site_5", name: "Riverfront Lofts", address: "67 Quay Lane", zone: "East", active: true },
    { id: "site_6", name: "Sector 7G Substation", address: "7G Industrial Park", zone: "West", active: true },
    { id: "site_7", name: "Old Mill Conversion", address: "33 Mill St", zone: "North", active: true },
    { id: "site_8", name: "Civic Library Annex", address: "1 Civic Blvd", zone: "Central", active: true },
    { id: "site_9", name: "South Wharf Depot", address: "9 Dock Rd", zone: "South", active: false },
    { id: "site_10", name: "Greenfield Logistics Hub", address: "55 Outer Ring", zone: "West", active: true },
  ];

  await db.insert(site).values(siteDefs.map((s) => ({ ...s, createdAt: now, updatedAt: now })));
  console.log("  ✓ 10 sites created");

  // ── Visits (28 days of history) ────────────────────────────────────────────
  const inspectionTypes = ["Structural Audit", "Safety Inspection", "Compliance Check", "Foundation Review", "Electrical Survey"];
  const noteTemplates = [
    "Routine inspection completed. No critical findings.",
    "Awaiting site access for additional units.",
    "Foreman walkthrough; punch list updated.",
    "All clear. Photos uploaded to record.",
    "Inspection logged on schedule.",
  ];

  const visitRows: (typeof visit.$inferInsert)[] = [];
  const inspectionRows: (typeof inspection.$inferInsert)[] = [];

  let counter = 0;
  const workerIds = workerDefs.map((d) => d.workerId);

  for (let dayOffset = 28; dayOffset >= 0; dayOffset--) {
    for (let wi = 0; wi < workerIds.length; wi++) {
      const base = wi === 0 ? 11 : 8;
      const count = Math.max(3, base + Math.round(Math.sin(dayOffset + wi) * 2));
      for (let v = 0; v < count; v++) {
        counter++;
        const d = new Date();
        d.setDate(d.getDate() - dayOffset);
        d.setHours(7 + Math.floor(v * (12 / count)), (v * 17) % 60, 0, 0);
        const ts = d.toISOString();
        const dateStr = ts.slice(0, 10);
        const vid = `visit_${dayOffset}_${wi}_${v}`;
        const iid = `insp_${dayOffset}_${wi}_${v}`;
        const km = String((4 + (counter % 6)).toFixed(2));

        visitRows.push({ id: vid, workerId: workerIds[wi], siteId: siteDefs[(dayOffset + v + wi) % siteDefs.length].id, date: dateStr, timestamp: ts, km, createdAt: ts, updatedAt: ts });
        inspectionRows.push({ id: iid, visitId: vid, type: inspectionTypes[(counter + wi) % inspectionTypes.length], notes: noteTemplates[counter % noteTemplates.length], timestamp: ts, createdAt: ts, updatedAt: ts });
      }
    }
  }

  const CHUNK = 100;
  for (let i = 0; i < visitRows.length; i += CHUNK) {
    await db.insert(visit).values(visitRows.slice(i, i + CHUNK));
  }
  for (let i = 0; i < inspectionRows.length; i += CHUNK) {
    await db.insert(inspection).values(inspectionRows.slice(i, i + CHUNK));
  }
  console.log(`  ✓ ${visitRows.length} visits + ${inspectionRows.length} inspections created`);

  console.log("\nSeeding complete!");
  console.log("\nDefault credentials:");
  console.log("  Admin  — admin@kinetic.enterprise  / Admin1234!");
  console.log("  Worker — marcus@kinetic.enterprise / Worker1234!");
  console.log("  Worker — sarah@kinetic.enterprise  / Worker1234!");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
