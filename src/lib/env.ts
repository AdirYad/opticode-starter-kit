import { z } from "zod";

/**
 * Server-side environment variables, validated once at startup.
 * Importing this module in a server file guarantees the vars exist and
 * fails fast with a clear message if they don't.
 *
 * Public (browser) vars use the NEXT_PUBLIC_ prefix and are read directly
 * from process.env where needed, because Next.js inlines them at build time.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Supabase connection string)."),
  AI_GATEWAY_API_KEY: z.string().min(1, "AI_GATEWAY_API_KEY is required (Vercel AI Gateway)."),
  AI_DEFAULT_MODEL: z.string().min(1).default("openai/gpt-4o-mini"),
});

const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Invalid or missing environment variables:\n${issues}\n\nCopy .env.example to .env and fill in the values.`,
  );
}

export const env = parsed.data;
