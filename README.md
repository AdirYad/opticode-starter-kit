# Opticode Starter

A production-grade starter for building real web apps fast.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Supabase · Drizzle ORM · Vercel AI Gateway · TypeScript.

> Agents: read [`AGENTS.md`](./AGENTS.md) (imported by `CLAUDE.md`) for architecture, conventions, and guardrails.

## Quick start

On any machine with Node 20+ and git:

```bash
git clone <your-repo-url> my-app
cd my-app
npm run setup        # installs dependencies and creates .env
```

Fill `.env` with real values, then:

```bash
npm run db:push      # create the database tables
npm run dev          # http://localhost:3000
```

## Configure services

1. **Supabase:** create a project. From Project Settings:
   - API: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Database, Connection string: set `DATABASE_URL`.
2. **Vercel AI Gateway:** create an API key at vercel.com, AI Gateway, then set `AI_GATEWAY_API_KEY`. Pick a default model in `AI_DEFAULT_MODEL`.

## Start a new project

```bash
npm run init-project
```

Sets the project name, description, and slug. Then set the brand color in `src/app/globals.css` (`--primary`), define your tables in `src/db/schema.ts`, and replace `src/app/page.tsx` and `public/llms.txt`.

## Database

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # create a migration
npm run db:migrate    # apply it
# or, while prototyping:
npm run db:push
npm run db:studio     # browse data
```

Enable Row Level Security and add the `profiles` signup trigger (see `AGENTS.md`).

## Scripts

`setup` · `init-project` · `dev` · `build` · `start` · `lint` · `typecheck` · `format` · `db:generate` · `db:migrate` · `db:push` · `db:studio`

## Deploy

Push to a Git remote, import in Vercel, add every variable from `.env.example`, and deploy.
