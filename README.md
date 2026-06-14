# Opticode Starter

A production-grade starter for building real web apps fast.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui · Supabase · Drizzle ORM · Vercel AI Gateway · TypeScript.

> Agents: read [`AGENTS.md`](./AGENTS.md) (imported by `CLAUDE.md`) for conventions and guardrails.

## Quick start

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

Open http://localhost:3000.

## Configure services

1. **Supabase:** create a project. From Project Settings:
   - API: set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Database, Connection string: set `DATABASE_URL`.
2. **Vercel AI Gateway:** create an API key at vercel.com, AI Gateway, then set `AI_GATEWAY_API_KEY`. Pick a default model in `AI_DEFAULT_MODEL`.

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

`dev` · `build` · `start` · `lint` · `typecheck` · `format` · `db:generate` · `db:migrate` · `db:push` · `db:studio`

## Deploy

Push to a Git remote, import in Vercel, add every variable from `.env.example`, and deploy.
