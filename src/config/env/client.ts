import { z } from "zod";

/**
 * Frontend (browser) environment: the single source of truth for public config.
 *
 * Only NEXT_PUBLIC_ vars belong here. They are inlined into the client bundle
 * and are safe to expose. Client Components and any browser-shared module
 * import `clientEnv` from here, and NEVER from ./server or ./index.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Reference each var explicitly so Next.js can inline it at build time.
const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid or missing public environment variables:\n${issues}`);
}

export const clientEnv = parsed.data;
