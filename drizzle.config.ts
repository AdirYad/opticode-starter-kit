import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit reads this when you run db:generate, db:migrate, db:push or
 * db:studio. It uses the same DATABASE_URL the app uses.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
