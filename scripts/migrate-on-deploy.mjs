#!/usr/bin/env node
/**
 * Applies database migrations during the Vercel build, on production deploys only.
 * This runs as the first half of the `build` script, so production gets its
 * migrations automatically with no extra setup beyond DATABASE_URL in Vercel.
 *
 * Local builds and Vercel preview builds skip it (they are not production), so
 * `npm run build` on your machine never touches a database.
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Not a Vercel production build; skipping database migrations.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in this environment; cannot migrate.");
  process.exit(1);
}

console.log("Production deploy: applying database migrations...");
const result = spawnSync("npm", ["run", "db:migrate"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 0);
