// Load env BEFORE any workspace imports that read process.env at module init time
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });

// Use DATABASE_URL only if it's a SQLite/libsql/Turso URL. Some hosts (e.g. Replit)
// auto-inject a PostgreSQL DATABASE_URL we must ignore — fall back to a local SQLite file.
const existingUrl = process.env.DATABASE_URL;
const isLibsqlUrl = !!existingUrl && /^(file:|libsql:|wss?:|https?:)/i.test(existingUrl);
if (!isLibsqlUrl) {
  // Normalize to forward slashes — @libsql/client requires file URLs without backslashes
  const dbPath = path.resolve(__dirname, "../../../lib/db/local.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
  delete process.env.DATABASE_AUTH_TOKEN; // not used for a local file DB
}

// Dynamic imports ensure env vars are set before @workspace/db initialises its pool
const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");
const { ensureDatabase } = await import("./lib/init-db");

const rawPort = process.env["PORT"] ?? "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Auto-create tables + seed default accounts on first run (no manual setup needed)
try {
  await ensureDatabase(logger);
} catch (err) {
  logger.error({ err }, "Database initialization failed");
  process.exit(1);
}

// Bind to 0.0.0.0 so hosting platforms (Replit, Render, etc.) can route traffic in
app.listen(port, "0.0.0.0", () => {
  logger.info({ port, db: process.env.DATABASE_URL }, "Server listening");
});
