import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Only accept SQLite/libsql/Turso URLs. Ignore non-libsql URLs (e.g. a PostgreSQL
// DATABASE_URL auto-injected by some hosts) and fall back to a local SQLite file.
const rawUrl = process.env.DATABASE_URL;
const url = rawUrl && /^(file:|libsql:|wss?:|https?:)/i.test(rawUrl) ? rawUrl : "file:./local.db";
// Cloud databases (Turso) require an auth token; local file DBs do not.
const authToken = url.startsWith("file:") ? undefined : process.env.DATABASE_AUTH_TOKEN;

export const client = createClient(authToken ? { url, authToken } : { url });
export const db = drizzle(client, { schema });

export * from "./schema";
