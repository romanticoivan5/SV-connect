// Load env BEFORE any workspace imports that read process.env at module init time
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.DATABASE_URL) {
  // Normalize to forward slashes — @libsql/client requires file URLs without backslashes
  const dbPath = path.resolve(__dirname, "../../../lib/db/local.db").replace(/\\/g, "/");
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Dynamic imports ensure env vars are set before @workspace/db initialises its pool
const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

const rawPort = process.env["PORT"] ?? "3001";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Bind to 0.0.0.0 so hosting platforms (Replit, Render, etc.) can route traffic in
app.listen(port, "0.0.0.0", () => {
  logger.info({ port, db: process.env.DATABASE_URL }, "Server listening");
});
