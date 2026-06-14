<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project guide

Guidance for any AI agent (and humans) working in this repository. Read this before making changes.

## What this is

A production-grade starter for building real web apps. The stack is fixed and opinionated — do not swap core pieces without being asked.

| Layer     | Choice                                                         |
| --------- | -------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router, React 19, Turbopack)               |
| UI        | **shadcn/ui** on **Tailwind CSS v4** (CSS-first, oklch tokens) |
| Database  | **Supabase** Postgres via **Drizzle ORM** (`postgres-js`)      |
| Auth      | **Supabase Auth** via `@supabase/ssr` (cookie sessions)        |
| AI        | **Vercel AI Gateway** via the **AI SDK** (`ai`)                |
| Hosting   | **Vercel**                                                     |
| Language  | **TypeScript**, `strict` mode                                  |

## Commands

```bash
pnpm dev            # local dev server (Turbopack)
pnpm build          # production build
pnpm typecheck      # tsc --noEmit — run before declaring work done
pnpm lint           # eslint
pnpm format         # prettier --write .
pnpm db:generate    # generate SQL migration from src/db/schema.ts
pnpm db:migrate     # apply migrations (uses DIRECT_URL)
pnpm db:push        # push schema straight to the DB (good for prototyping)
pnpm db:studio      # open Drizzle Studio
```

Use **pnpm** (not npm/yarn). After any code change, run `pnpm typecheck` and `pnpm lint`.

## Environment

- Config lives in **`.env`** (gitignored). There is **no `.env.local`** in this project.
- **`.env.example`** is the tracked template — keep it in sync when adding a variable.
- **Never** commit `.env`, print secrets, or expose a non-`NEXT_PUBLIC_` variable to client code.
- Server vars are validated once in `src/lib/env.ts`; a missing/invalid var fails fast with a clear message. Add new **server** vars there. **Public** vars use the `NEXT_PUBLIC_` prefix and are read directly from `process.env`.

## Folder structure

```
src/
  app/                  # routes (App Router)
    api/chat/route.ts   # AI Gateway endpoint
    login/              # auth: page.tsx (form) + actions.ts (server actions)
    dashboard/          # example protected route
    robots.ts sitemap.ts# SEO
  components/ui/         # shadcn components (generated — edit sparingly)
  db/
    index.ts            # runtime db client (pooled, prepare:false)
    schema.ts           # Drizzle schema — the source of truth for tables
  lib/
    env.ts              # validated server env
    supabase/           # client.ts (browser) · server.ts · middleware.ts
    utils.ts            # cn()
  proxy.ts              # refreshes auth session + guards private routes (Next 16 convention)
drizzle/                # generated SQL migrations (do not hand-edit)
```

## Database (Drizzle + Supabase)

- **Two connections, on purpose:**
  - `DATABASE_URL` — pooled "Transaction" connection (port 6543), used by the app at runtime. Prepared statements are **disabled** (`prepare: false` in `src/db/index.ts`) because the transaction pooler does not support them. Do not remove that flag.
  - `DIRECT_URL` — direct connection (port 5432), used **only** by `drizzle-kit` for migrations.
- **Workflow:** edit `src/db/schema.ts` → `pnpm db:generate` → review the SQL in `drizzle/` → `pnpm db:migrate`. For quick prototyping, `pnpm db:push`.
- Column naming: write camelCase in the schema; it maps to snake_case columns automatically (`casing: "snake_case"`). Don't rename existing columns casually — it breaks data.
- **Row Level Security:** Supabase tables are exposed via PostgREST. Enable RLS and write policies for any table holding user data. Drizzle (server-side, direct connection) bypasses RLS, so keep all DB writes in server code, never in the browser.
- `profiles.id` is meant to equal `auth.users.id`. Create the row on signup with a Postgres trigger:
  ```sql
  create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = public as $$
  begin
    insert into public.profiles (id, email) values (new.id, new.email);
    return new;
  end; $$;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  ```

## Auth (@supabase/ssr)

- Three clients, do not mix them up:
  - `lib/supabase/client.ts` → Client Components (`"use client"`).
  - `lib/supabase/server.ts` → Server Components, Server Actions, Route Handlers. It is **async** (`cookies()` is async in Next 16) — always `await createClient()`.
  - `lib/supabase/middleware.ts` → session refresh helper, called from `src/proxy.ts`.
- **For authorization in server code, use `getUser()`** (revalidates against Supabase), not `getSession()`.
- In `proxy.ts`, keep the code between `createServerClient` and `getUser()` empty. Inserting logic there causes random logouts.
- Add private routes by extending `protectedPaths` in `lib/supabase/middleware.ts`.

## UI (shadcn/ui + Tailwind v4)

- Add components with `pnpm dlx shadcn@latest add <name>`. They land in `src/components/ui/`.
- Theming is CSS variables in `src/app/globals.css` (oklch). The brand accent (`--primary`, `--ring`) is blue `#3b82f6`. Adjust tokens there, not per-component.
- Compose classes with `cn()` from `@/lib/utils`. Tailwind v4 has **no `tailwind.config.js`** — configure via `@theme` in `globals.css`.
- **RTL:** the default is LTR. For a Hebrew/RTL site, set `<html dir="rtl">` in `layout.tsx`; Tailwind logical utilities and shadcn handle the rest.

## AI (Vercel AI Gateway)

- Use the `ai` package. Pass the model as a `"<provider>/<model>"` string (e.g. `"openai/gpt-4o-mini"`, `"anthropic/claude-sonnet-4.5"`); with `AI_GATEWAY_API_KEY` set, requests route through the gateway — no per-provider keys.
- Example endpoint: `src/app/api/chat/route.ts` (`generateText`). To stream, switch to `streamText` + `toUIMessageStreamResponse()`. Default model is `AI_DEFAULT_MODEL`.

## SEO / GEO

- Per-page metadata via the `metadata` export (title template + OpenGraph are set in `layout.tsx`).
- `robots.ts`, `sitemap.ts`, and `public/llms.txt` exist — update them as routes change. `llms.txt` helps AI search engines; replace its placeholder copy per project.

## Conventions

- TypeScript `strict`. No `any` unless justified with a comment.
- Server-first: keep data fetching and secrets in Server Components / Actions / Route Handlers. Add `"use client"` only when you need interactivity.
- Validate external input with `zod`.
- Format with Prettier (`printWidth` 100). Run `pnpm format` before committing.

## Guardrails — do not

- Commit `.env` or any secret; log credentials; or read service-role keys into client code.
- Remove `prepare: false` from `src/db/index.ts`.
- Put database writes or secret keys in Client Components.
- Hand-edit files in `drizzle/` (generated) or rewrite generated `components/ui` wholesale.
- Run destructive DB commands (`db:push` against production, `DROP`, truncate) without explicit confirmation.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add every variable from `.env.example` in Project → Settings → Environment Variables.
3. AI Gateway works automatically on Vercel; locally it needs `AI_GATEWAY_API_KEY`.
4. Build command `pnpm build`, output is detected automatically.
