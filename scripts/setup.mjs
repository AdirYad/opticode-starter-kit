#!/usr/bin/env node
/**
 * One-command setup for a fresh clone on any machine.
 *   npm run setup   (or: node scripts/setup.mjs)
 *
 * Installs dependencies, creates the env file from the template, and prints
 * the remaining steps. It never touches your database or writes secrets.
 */
import { existsSync, copyFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

const log = (m) => console.log(m);
const step = (m) => console.log(`\n> ${m}`);

// 1. Node version check.
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`Node 20+ is required. You have ${process.versions.node}.`);
  process.exit(1);
}

// 2. Install dependencies.
step("Installing dependencies (npm install)");
const install = spawnSync("npm", ["install"], { stdio: "inherit", shell: true });
if (install.status !== 0) process.exit(install.status ?? 1);

// 3. Create the local env file from the example if it does not exist.
const ENV = ".env";
const EXAMPLE = ".env.example";
step("Checking environment file");
if (existsSync(ENV)) {
  log(`${ENV} already exists, leaving it as is.`);
} else if (existsSync(EXAMPLE)) {
  copyFileSync(EXAMPLE, ENV);
  log(`Created ${ENV} from ${EXAMPLE}.`);
} else {
  log(`No ${EXAMPLE} found, skipping.`);
}

// 4. Warn if the env still holds placeholder values.
let needsValues = false;
if (existsSync(ENV)) {
  needsValues = /YOUR-|your-|placeholder/.test(readFileSync(ENV, "utf8"));
}

// 5. Next steps.
step("Setup complete");
if (needsValues) {
  log(`Fill in real values in ${ENV}:`);
  log("  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY");
  log("  - DATABASE_URL");
  log("  - AI_GATEWAY_API_KEY");
}
log("Then run:");
log("  npm run db:push   # create the database tables");
log("  npm run dev       # start the app at http://localhost:3000");
