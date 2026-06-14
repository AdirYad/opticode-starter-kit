# OptiCode Starter Kit

A production-grade starter for building real web apps fast. Auth, database, AI, and SEO are wired up so you can start on features, not plumbing.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Supabase · Drizzle ORM · Vercel AI Gateway · TypeScript (strict).

> Working with an AI agent? Point it at [`AGENTS.md`](./AGENTS.md) (imported by `CLAUDE.md`) for architecture, conventions, and guardrails.

## What you get

- **Auth** via Supabase + `@supabase/ssr` (cookie sessions, protected routes through `src/proxy.ts`).
- **Database** as Supabase Postgres through Drizzle ORM, one `DATABASE_URL`, typed schema as the source of truth.
- **AI** through the Vercel AI Gateway: one key, any model, no per-provider setup.
- **UI** with shadcn/ui on Tailwind v4 (semantic tokens, dark mode, RTL-safe).
- **SEO** with per-page metadata, `robots.ts`, `sitemap.ts`, and `public/llms.txt`.

## Prerequisites

- Node 20+ and git.
- A free [Supabase](https://supabase.com/dashboard) project (for auth and the database).
- A [Vercel](https://vercel.com/dashboard) account with AI Gateway enabled (for AI features).

## Quick start

```bash
git clone https://github.com/AdirYad/opticode-starter-kit.git my-app
cd my-app
npm run setup        # installs dependencies and creates .env from the template
```

Fill `.env` with real values (see the table below), then:

```bash
npm run db:push      # create the database tables
npm run dev          # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env` (the setup script does this) and fill it in. `.env.example` has inline notes; this is the summary of where each value comes from.

| Variable                        | Required | Where to get it                                                                                                 |
| ------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | Prod     | Your app URL. Local defaults to `http://localhost:3000`; set your real domain in production.                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase Dashboard, your project, Settings, API. The Project URL.                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Same page, the `anon` / public key. Browser-safe.                                                               |
| `DATABASE_URL`                  | Yes      | Supabase Dashboard, "Connect" button, ORMs or Connection string. Insert your DB password. Use a pooler on IPv4. |
| `AI_GATEWAY_API_KEY`            | For AI   | Vercel Dashboard, AI Gateway, API Keys. Injected automatically on Vercel deploys.                               |
| `AI_DEFAULT_MODEL`              | No       | A `<provider>/<model>` string. Defaults to `openai/gpt-4o-mini`.                                                |

Server vars (`DATABASE_URL`, `AI_*`) are validated at startup in `src/lib/env.ts` and fail fast with a clear message. `NEXT_PUBLIC_` vars ship to the browser, so never put a secret (like the Supabase `service_role` key) behind that prefix.

## Database

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # create a migration from the schema
npm run db:migrate    # apply it
npm run db:studio     # browse data
# while prototyping against a scratch DB only:
npm run db:push       # push schema straight to the DB, no migration file
```

Enable Row Level Security and add the `profiles` signup trigger before going live (SQL is in [`AGENTS.md`](./AGENTS.md)).

## Start a new project

```bash
npm run init-project   # set project name, description, and slug
```

Then set the brand color in `src/app/globals.css` (`--primary`), define your tables in `src/db/schema.ts`, and replace `src/app/page.tsx` and `public/llms.txt` with your content.

## Scripts

| Script                 | Does                                           |
| ---------------------- | ---------------------------------------------- |
| `npm run setup`        | Install deps and create `.env` on a fresh box  |
| `npm run init-project` | Set name, description, brand for a new project |
| `npm run dev`          | Dev server (Turbopack)                         |
| `npm run build`        | Production build                               |
| `npm run start`        | Serve the production build                     |
| `npm run typecheck`    | `tsc --noEmit`                                 |
| `npm run lint`         | ESLint                                         |
| `npm run format`       | Prettier write                                 |
| `npm run db:generate`  | Generate a SQL migration from the schema       |
| `npm run db:migrate`   | Apply migrations                               |
| `npm run db:push`      | Push schema to the DB (prototyping only)       |
| `npm run db:studio`    | Open Drizzle Studio                            |

Run `npm run typecheck` and `npm run lint` before calling work done. A Husky pre-commit hook auto-formats and lints staged files.

## Deploy (Vercel)

1. Push to a Git remote and import the repo in Vercel.
2. Add every variable from `.env.example` under Project, Settings, Environment Variables. `AI_GATEWAY_API_KEY` is supplied automatically on Vercel.
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Deploy. The build command (`npm run build`) and output are detected automatically.
