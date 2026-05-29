import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export default defineConfig({
  schema: "./src/schema/*.ts",
  dialect: "sqlite",
  ...(url.startsWith("libsql") || url.startsWith("https")
    ? { driver: "turso" }
    : {}),
  dbCredentials: authToken ? { url, authToken } : { url },
});
