import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads this when you run db:generate / db:migrate / db:push / db:studio.
 * Migrations use DIRECT_URL (the direct, port 5432 connection) — NOT the pooled
 * runtime URL — because schema changes need a session-mode connection.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DIRECT_URL!,
  },
  verbose: true,
  strict: true,
});
