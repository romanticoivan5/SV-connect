import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// ── Serve the built admin website (production single-service deployment) ──────
// In production the React site is built to artifacts/admin-web/dist/public and
// served by this same Express server so the whole app lives at ONE URL.
// Resolve relative to this module (works for both tsx src/ and the bundled dist/),
// not cwd — so the website is found no matter where node is launched from.
const staticDir =
  process.env.STATIC_DIR ??
  path.resolve(moduleDir, "../../admin-web/dist/public");

if (fs.existsSync(staticDir)) {
  logger.info({ staticDir }, "Serving static frontend");
  app.use(express.static(staticDir));

  // SPA fallback — any non-API route returns index.html so client-side
  // routing (wouter) works on refresh/deep links.
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
