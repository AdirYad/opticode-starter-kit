import "server-only";
import { z } from "zod";

/**
 * Backend (server-only) environment: secrets and server config.
 *
 * The `server-only` import turns any attempt to import this from client code
 * into a build error, so secrets can never reach the browser bundle. Server
 * code should import the merged `env` from ./index rather than this directly.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (Supabase connection string)."),
  AI_GATEWAY_API_KEY: z.string().min(1, "AI_GATEWAY_API_KEY is required (Vercel AI Gateway)."),
  AI_DEFAULT_MODEL: z.string().min(1).default("openai/gpt-4o-mini"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("onboarding@resend.dev"),
});

const parsed = serverSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
  AI_DEFAULT_MODEL: process.env.AI_DEFAULT_MODEL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Invalid or missing server environment variables:\n${issues}\n\nCopy .env.example to .env and fill in the values.`,
  );
}

export const serverEnv = parsed.data;
