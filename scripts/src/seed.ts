import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../../lib/db/src/schema/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../lib/db/local.db").replace(/\\/g, "/");
const url = process.env.DATABASE_URL ?? `file:${dbPath}`;
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });
const db = drizzle(client, { schema });
const { usersTable, announcementsTable } = schema;

// bcrypt cost 10 — compatible with bcryptjs v3 on Windows
const BCRYPT_ROUNDS = 10;

// Dynamic import of bcryptjs avoids native module init issues
const bcrypt = await import("bcryptjs").then(m => m.default ?? m);

const force = process.argv.includes("--force");

async function upsertUser(data: {
  firstName: string; lastName: string; email: string; password: string;
  role: "admin" | "resident"; address?: string; contactNumber?: string;
}) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, data.email));
  const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  // Verify the hash works before storing
  const valid = await bcrypt.compare(data.password, hash);
  if (!valid) throw new Error(`Hash verification failed for ${data.email}`);

  if (existing && !force) {
    // Update password hash to ensure it's always valid
    await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.email, data.email));
    console.log(`Updated password for: ${data.email}`);
  } else if (!existing) {
    await db.insert(usersTable).values({
      firstName: data.firstName, lastName: data.lastName, email: data.email,
      passwordHash: hash, role: data.role, status: "active",
      address: data.address, contactNumber: data.contactNumber,
    });
    console.log(`Created ${data.role}: ${data.email}`);
  } else {
    // force mode — update everything
    await db.update(usersTable).set({ passwordHash: hash, status: "active" }).where(eq(usersTable.email, data.email));
    console.log(`Force-updated: ${data.email}`);
  }
}

async function seed() {
  console.log(`Seeding database (force=${force})...`);
  console.log(`Database: ${url}`);

  await upsertUser({ firstName: "Barangay", lastName: "Admin", email: "admin@barangay.ph", password: "admin123", role: "admin", address: "Barangay Hall, Main Street", contactNumber: "09001234567" });
  await upsertUser({ firstName: "Juan", lastName: "dela Cruz", email: "juan@example.com", password: "resident123", role: "resident", address: "123 Rizal St", contactNumber: "09111111111" });
  await upsertUser({ firstName: "Ana", lastName: "Santos", email: "ana@example.com", password: "resident123", role: "resident", address: "456 Mabini Ave", contactNumber: "09222222222" });
  await upsertUser({ firstName: "Carlos", lastName: "Reyes", email: "carlos@example.com", password: "resident123", role: "resident", address: "789 Bonifacio Blvd", contactNumber: "09333333333" });
  await upsertUser({ firstName: "Liza", lastName: "Garcia", email: "liza@example.com", password: "resident123", role: "resident", address: "321 Aguinaldo St", contactNumber: "09444444444" });

  // Seed announcements only if none exist
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@barangay.ph"));
  const existing = await db.select().from(announcementsTable).limit(1);
  if (admin && existing.length === 0) {
    await db.insert(announcementsTable).values([
      { title: "Community Clean-Up Drive", content: "All residents are invited to join our monthly clean-up drive this Saturday at 7:00 AM.", category: "Community", authorId: admin.id },
      { title: "Barangay Health Fair", content: "Free medical check-up and consultations at the Barangay Hall on Friday, 8:00 AM–4:00 PM.", category: "Health", authorId: admin.id },
      { title: "Updated Office Hours", content: "Barangay Hall is open Monday–Friday 8:00 AM–5:00 PM. Saturday 8:00 AM–12:00 PM.", category: "Administrative", authorId: admin.id },
    ]);
    console.log("Created sample announcements.");
  }

  console.log("\nSeed complete!");
  console.log("Admin:    admin@barangay.ph  /  admin123");
  console.log("Resident: juan@example.com   /  resident123");
  client.close();
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
