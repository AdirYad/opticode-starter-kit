/**
 * Single source of truth for site-wide branding and metadata.
 * When starting a new project, change these (or run `npm run init-project`).
 */
export const siteConfig = {
  name: "OptiCode Starter Kit",
  description:
    "Production-grade starter: Next.js 16, Supabase, Drizzle, shadcn/ui, and the Vercel AI Gateway.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
