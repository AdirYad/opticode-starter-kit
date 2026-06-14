#!/usr/bin/env node
/**
 * Initialize a fresh project from this starter.
 *   npm run init-project   (or: node scripts/init-project.mjs)
 *
 * Sets the project name and description in src/config/site.ts and package.json,
 * then optionally resets git history for a clean start.
 */
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback) => {
  const answer = (await rl.question(`${q}${fallback ? ` (${fallback})` : ""}: `)).trim();
  return answer || fallback || "";
};

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "my-app";

const name = await ask("Project name", "My App");
const description = await ask(
  "Short description",
  "A web app built with the OptiCode Starter Kit.",
);
const slug = toSlug(name);
const reset = (await ask("Reset git history for a clean start? y/N", "N")).toLowerCase() === "y";
rl.close();

// 1. src/config/site.ts
const site = `/**
 * Single source of truth for site-wide branding and metadata.
 * When starting a new project, change these (or run \`npm run init-project\`).
 */
export const siteConfig = {
  name: ${JSON.stringify(name)},
  description: ${JSON.stringify(description)},
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
`;
writeFileSync("src/config/site.ts", site);

// 2. package.json name
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
pkg.name = slug;
writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

// 3. Optional clean git history.
if (reset) {
  rmSync(".git", { recursive: true, force: true });
  spawnSync("git", ["init"], { stdio: "inherit", shell: true });
}

console.log(`\nDone. Project set to "${name}" (${slug}).`);
console.log("Next:");
console.log("  - set the brand color in src/app/globals.css (--primary)");
console.log("  - define your tables in src/db/schema.ts, then npm run db:push");
console.log("  - replace the landing page (src/app/page.tsx) and public/llms.txt");
console.log("  - npm run dev");
