#!/usr/bin/env node
/**
 * One-command setup for a fresh clone on any machine.
 *   npm run setup   (or: node scripts/setup.mjs)
 *
 * Checks Node, installs dependencies, then walks you through the environment
 * variables interactively (scripts/env-setup.mjs). It never touches your database.
 */
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

// 3. Configure environment variables interactively.
step("Configuring environment");
const envSetup = spawnSync("node", ["scripts/env-setup.mjs"], { stdio: "inherit" });
if (envSetup.status !== 0) process.exit(envSetup.status ?? 1);

// 4. Next steps.
step("Setup complete");
log("Then run:");
log("  npm run db:push   # create the database tables");
log("  npm run dev       # start the app at http://localhost:3000");
