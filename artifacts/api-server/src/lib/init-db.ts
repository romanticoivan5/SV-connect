import bcrypt from "bcryptjs";
import { client, db, usersTable, announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Logger } from "pino";

// Table definitions matching lib/db/src/schema (SQLite). Idempotent — safe to run
// on every startup. created_at defaults to unixepoch() (seconds) to match
// drizzle's integer timestamp mode.
const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'resident' NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    address text,
    contact_number text,
    created_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (email)`,
  `CREATE TABLE IF NOT EXISTS requests (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id integer NOT NULL REFERENCES users(id),
    type text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    remarks text,
    processed_by integer REFERENCES users(id),
    processed_at integer,
    created_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text,
    author_id integer NOT NULL REFERENCES users(id),
    created_at integer DEFAULT (unixepoch()) NOT NULL,
    updated_at integer
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    user_id integer NOT NULL REFERENCES users(id),
    title text NOT NULL,
    message text NOT NULL,
    type text,
    is_read integer DEFAULT 0 NOT NULL,
    request_id integer REFERENCES requests(id),
    created_at integer DEFAULT (unixepoch()) NOT NULL
  )`,
];

const SEED_RESIDENTS = [
  { firstName: "Juan", lastName: "dela Cruz", email: "juan@example.com", address: "123 Rizal St", contactNumber: "09111111111" },
  { firstName: "Ana", lastName: "Santos", email: "ana@example.com", address: "456 Mabini Ave", contactNumber: "09222222222" },
  { firstName: "Carlos", lastName: "Reyes", email: "carlos@example.com", address: "789 Bonifacio Blvd", contactNumber: "09333333333" },
  { firstName: "Liza", lastName: "Garcia", email: "liza@example.com", address: "321 Aguinaldo St", contactNumber: "09444444444" },
];

/**
 * Ensures the database schema exists and seeds the default admin + resident
 * accounts on first run. Safe to call on every startup (idempotent).
 */
export async function ensureDatabase(log: Logger): Promise<void> {
  // 1. Create tables if they don't exist
  for (const stmt of DDL) {
    await client.execute(stmt);
  }
  log.info("Database schema ready");

  // 2. Seed accounts only if the users table is empty (first run)
  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) {
    log.info("Database already seeded — skipping");
    return;
  }

  log.info("Empty database — seeding default accounts");

  const adminHash = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values({
    firstName: "Barangay",
    lastName: "Admin",
    email: "admin@barangay.ph",
    passwordHash: adminHash,
    role: "admin",
    status: "active",
    address: "Barangay Hall, Main Street",
    contactNumber: "09001234567",
  });

  const residentHash = await bcrypt.hash("resident123", 10);
  for (const r of SEED_RESIDENTS) {
    await db.insert(usersTable).values({
      ...r,
      passwordHash: residentHash,
      role: "resident",
      status: "active",
    });
  }

  // Sample announcements authored by the admin
  const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@barangay.ph"));
  if (admin) {
    await db.insert(announcementsTable).values([
      { title: "Community Clean-Up Drive", content: "All residents are invited to join our monthly clean-up drive this Saturday at 7:00 AM.", category: "Community", authorId: admin.id },
      { title: "Barangay Health Fair", content: "Free medical check-up and consultations at the Barangay Hall on Friday, 8:00 AM-4:00 PM.", category: "Health", authorId: admin.id },
      { title: "Updated Office Hours", content: "Barangay Hall is open Monday-Friday 8:00 AM-5:00 PM. Saturday 8:00 AM-12:00 PM.", category: "Administrative", authorId: admin.id },
    ]);
  }

  log.info("Seeding complete — admin@barangay.ph / admin123");
}
