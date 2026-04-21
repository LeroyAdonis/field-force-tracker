import { db, user, account, userRole, worker, site, visit, inspection, photo } from "./index";
import { hashPassword } from "better-auth/crypto";

async function seed() {
  console.log("🌱 Seeding database with demo data...");

  try {
    // ==========================================
    // 1. CREATE DEMO USERS
    // ==========================================
    console.log("  Creating demo users...");

    // Use basic password hashing (Better Auth will handle this in production)
    // For now, we'll use plain text for demo (schema doesn't enforce hashing at DB level)
    const demoUsers = [
      {
        id: "user_admin_demo",
        email: "admin@kinetic.enterprise",
        name: "Eleanor Vance",
        emailVerified: true,
      },
      {
        id: "user_marcus_demo",
        email: "marcus@kinetic.enterprise",
        name: "Marcus Kane",
        emailVerified: true,
      },
      {
        id: "user_sarah_demo",
        email: "sarah@kinetic.enterprise",
        name: "Sarah Miller",
        emailVerified: true,
      },
    ];

    await db.insert(user).values(demoUsers).onConflictDoNothing();
    console.log("    ✓ Created 3 demo users");

    // ==========================================
    // 1b. CREATE CREDENTIAL ACCOUNTS (for email/password login)
    // ==========================================
    console.log("  Creating demo accounts...");

    const passwordHash = await hashPassword("demo");
    const demoAccounts = [
      {
        id: "account_admin_demo",
        userId: "user_admin_demo",
        accountId: "user_admin_demo",
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "account_marcus_demo",
        userId: "user_marcus_demo",
        accountId: "user_marcus_demo",
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "account_sarah_demo",
        userId: "user_sarah_demo",
        accountId: "user_sarah_demo",
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.insert(account).values(demoAccounts).onConflictDoNothing();
    console.log("    ✓ Created 3 demo credential accounts");

    // ==========================================
    // 2. CREATE USER ROLES
    // ==========================================
    console.log("  Creating user roles...");

    const demoRoles = [
      {
        id: "role_admin_demo",
        userId: "user_admin_demo",
        role: "admin",
        displayName: "Eleanor Vance",
        avatar: "https://i.pravatar.cc/120?img=5",
        active: true,
      },
      {
        id: "role_marcus_demo",
        userId: "user_marcus_demo",
        role: "worker",
        displayName: "Marcus Kane",
        avatar: "https://i.pravatar.cc/120?img=12",
        active: true,
      },
      {
        id: "role_sarah_demo",
        userId: "user_sarah_demo",
        role: "worker",
        displayName: "Sarah Miller",
        avatar: "https://i.pravatar.cc/120?img=47",
        active: true,
      },
    ];

    await db.insert(userRole).values(demoRoles).onConflictDoNothing();
    console.log("    ✓ Created 3 user roles");

    // ==========================================
    // 3. CREATE WORKERS
    // ==========================================
    console.log("  Creating demo workers...");

    const demoWorkers = [
      {
        id: "worker_marcus_demo",
        userRoleId: "role_marcus_demo",
        jobTitle: "Lead Inspector",
        dailyKmTarget: 120,
        active: true,
        isDemo: true,
      },
      {
        id: "worker_sarah_demo",
        userRoleId: "role_sarah_demo",
        jobTitle: "Senior Surveyor",
        dailyKmTarget: 120,
        active: true,
        isDemo: true,
      },
    ];

    await db.insert(worker).values(demoWorkers).onConflictDoNothing();
    console.log("    ✓ Created 2 demo workers");

    // ==========================================
    // 4. CREATE SITES
    // ==========================================
    console.log("  Creating demo sites...");

    const demoSites = [
      {
        id: "site_1",
        name: "North Creek Terminal",
        address: "120 Harbor Way",
        zone: "North",
        active: true,
      },
      {
        id: "site_2",
        name: "Bridge View Site",
        address: "44 Riverside Dr",
        zone: "Central",
        active: true,
      },
      {
        id: "site_3",
        name: "Central Plaza Phase 1",
        address: "8 Market Sq",
        zone: "Central",
        active: true,
      },
      {
        id: "site_4",
        name: "The Heights Residency",
        address: "210 Hilltop Rd",
        zone: "South",
        active: true,
      },
      {
        id: "site_5",
        name: "Riverfront Lofts",
        address: "67 Quay Lane",
        zone: "East",
        active: true,
      },
      {
        id: "site_6",
        name: "Sector 7G Substation",
        address: "7G Industrial Park",
        zone: "West",
        active: true,
      },
      {
        id: "site_7",
        name: "Old Mill Conversion",
        address: "33 Mill St",
        zone: "North",
        active: true,
      },
      {
        id: "site_8",
        name: "Civic Library Annex",
        address: "1 Civic Blvd",
        zone: "Central",
        active: true,
      },
      {
        id: "site_9",
        name: "South Wharf Depot",
        address: "9 Dock Rd",
        zone: "South",
        active: false,
      },
      {
        id: "site_10",
        name: "Greenfield Logistics Hub",
        address: "55 Outer Ring",
        zone: "West",
        active: true,
      },
    ];

    await db.insert(site).values(demoSites).onConflictDoNothing();
    console.log("    ✓ Created 10 demo sites");

    // ==========================================
    // 5. CREATE VISITS WITH INSPECTIONS & PHOTOS
    // ==========================================
    console.log("  Creating demo visits...");

    const inspectionTypes = ["Structural Audit", "Safety Inspection", "Compliance Check", "Foundation Review", "Electrical Survey"];

    const today = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const at = (offsetDays: number, hour = 9, minute = 0) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      d.setHours(hour, minute, 0, 0);
      return d;
    };
    const dateOf = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offsetDays);
      return iso(d);
    };

    let visitCounter = 0;
    let inspectionCounter = 0;
    let photoCounter = 0;

    const visits_to_insert = [];
    const inspections_to_insert = [];
    const photos_to_insert = [];

    // Create 28 days of demo visits
    for (let day = 0; day < 28; day++) {
      for (const workerId of ["worker_marcus_demo", "worker_sarah_demo"]) {
        const numVisits = Math.max(2, 8 + Math.round(Math.sin(day) * 2));

        for (let v = 0; v < numVisits; v++) {
          const visitId = `visit_${day}_${workerId}_${v}`;
          const siteId = demoSites[(day + v) % demoSites.length].id;
          const inspectionId = `inspection_${visitCounter}`;
          const timestamp = at(day, 7 + v, Math.floor(Math.random() * 60));

          // Add visit
          visits_to_insert.push({
            id: visitId,
            workerId,
            siteId,
            date: dateOf(day),
            timestamp,
            km: parseFloat((4 + (v % 5)).toFixed(2)),
          });

          // Add inspection
          inspections_to_insert.push({
            id: inspectionId,
            visitId,
            type: inspectionTypes[(day + v) % inspectionTypes.length],
            notes: "Routine inspection completed. No critical findings.",
            timestamp,
          });

          // Add 1-2 photos per inspection
          const numPhotos = Math.random() > 0.5 ? 2 : 1;
          for (let p = 0; p < numPhotos; p++) {
            photos_to_insert.push({
              id: `photo_${photoCounter}`,
              inspectionId,
              dataUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23${Math.floor(Math.random() * 16777215).toString(16)}' width='200' height='200'/%3E%3C/svg%3E`,
              caption: `Photo ${p + 1} from ${dateOf(day)}`,
            });
            photoCounter++;
          }

          visitCounter++;
        }
      }
    }

    // Batch insert all visits
    if (visits_to_insert.length > 0) {
      // Insert in chunks to avoid payload size issues
      const chunkSize = 100;
      for (let i = 0; i < visits_to_insert.length; i += chunkSize) {
        await db.insert(visit).values(visits_to_insert.slice(i, i + chunkSize)).onConflictDoNothing();
      }
    }
    console.log(`    ✓ Created ${visits_to_insert.length} visits`);

    // Batch insert inspections
    if (inspections_to_insert.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < inspections_to_insert.length; i += chunkSize) {
        await db.insert(inspection).values(inspections_to_insert.slice(i, i + chunkSize)).onConflictDoNothing();
      }
    }
    console.log(`    ✓ Created ${inspections_to_insert.length} inspections`);

    // Batch insert photos
    if (photos_to_insert.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < photos_to_insert.length; i += chunkSize) {
        await db.insert(photo).values(photos_to_insert.slice(i, i + chunkSize)).onConflictDoNothing();
      }
    }
    console.log(`    ✓ Created ${photos_to_insert.length} photos`);

    console.log("\n✅ Seeding complete!");
    console.log("\n Demo users:");
    console.log('   Email: admin@kinetic.enterprise / Password: demo');
    console.log('   Email: marcus@kinetic.enterprise / Password: demo');
    console.log('   Email: sarah@kinetic.enterprise / Password: demo');
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
