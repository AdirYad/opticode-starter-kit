#!/usr/bin/env node
/**
 * Interactive environment setup.
 *   npm run env   (or: node scripts/env-setup.mjs)
 *
 * Reads .env.example, asks for each variable (showing its inline comment as
 * help and the current/example value as the default), and writes .env.
 * Re-runnable: existing .env values become the defaults, so nothing is lost.
 * In a non-interactive shell it just copies the template.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import process from "node:process";

const EXAMPLE = ".env.example";
const ENV = ".env";

if (!existsSync(EXAMPLE)) {
  console.error(`${EXAMPLE} not found.`);
  process.exit(1);
}

const exampleLines = readFileSync(EXAMPLE, "utf8").split(/\r?\n/);

// Existing .env values become defaults, so re-running keeps your answers.
const current = {};
if (existsSync(ENV)) {
  for (const line of readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) current[match[1]] = match[2];
  }
}

const interactive = process.stdin.isTTY && process.stdout.isTTY;
if (!interactive) {
  if (!existsSync(ENV)) writeFileSync(ENV, exampleLines.join("\n") + "\n");
  console.log("Non-interactive shell. Wrote .env from the template; edit it by hand.");
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log("\nEnvironment setup. Press Enter to keep the [default].\n");

const out = [];
let help = [];
for (const line of exampleLines) {
  const kv = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (kv) {
    const [, key, exampleValue] = kv;
    const def = current[key] ?? exampleValue;
    if (help.length) console.log(help.map((h) => `  ${h}`).join("\n"));
    const answer = (await rl.question(`${key} [${def}]: `)).trim();
    out.push(`${key}=${answer || def}`);
    help = [];
    console.log("");
  } else if (line.startsWith("#")) {
    out.push(line);
    help.push(line.replace(/^#\s?/, ""));
  } else {
    out.push(line);
    help = [];
  }
}

rl.close();
writeFileSync(ENV, out.join("\n").replace(/\n*$/, "\n"));
console.log(`Wrote ${ENV}. Re-run anytime with: npm run env`);
