/**
 * Single source of truth for site-wide branding and metadata.
 * When starting a new project, change these (or run `npm run init-project`).
 */
import { clientEnv } from "@/config/env/client";

export const siteConfig = {
  name: "OptiCode Starter Kit",
  description:
    "Production-grade starter: Next.js 16, Supabase, Drizzle, shadcn/ui, and the Vercel AI Gateway.",
  url: clientEnv.NEXT_PUBLIC_APP_URL,
} as const;
