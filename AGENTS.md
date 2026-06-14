# Project guide

Guidance for any AI agent (and humans) working in this repository. Read this before making changes. The goal is the cleanest, simplest correct code, so follow the architecture and conventions below rather than inventing your own.

## What this is

A production-grade starter for building real web apps. The stack is fixed and opinionated, so do not swap core pieces without being asked.

| Layer     | Choice                                                         |
| --------- | -------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router, React 19, Turbopack)               |
| UI        | **shadcn/ui** on **Tailwind CSS v4** (CSS-first, oklch tokens) |
| Database  | **Supabase** Postgres via **Drizzle ORM** (`postgres-js`)      |
| Auth      | **Supabase Auth** via `@supabase/ssr` (cookie sessions)        |
| AI        | **Vercel AI Gateway** via the **AI SDK** (`ai`)                |
| Hosting   | **Vercel**                                                     |
| Language  | **TypeScript**, `strict` mode                                  |

## Architecture

The code is organized in layers with a one-way dependency direction. An outer layer may import from an inner layer, never the reverse.

```
app/         UI routes and server actions. Thin: it orchestrates, it does not hold business logic.
components/   Presentational React. ui/ holds generated primitives; feature folders hold composed UI.
lib/         Cross-cutting helpers: env, supabase clients, utils.
db/          Data access: schema, client, queries. The only place that talks to Postgres.
config/      Static project configuration (site name, brand, base URL).
```

Dependency rules:

- `db/` and `lib/` never import from `app/` or `components/`.
- `components/` never imports from `app/`. Components receive data through props.
- Only server code (Server Components, Server Actions, Route Handlers) imports `db`, `lib/env`, or `lib/supabase/server`.

Request lifecycle:

1. A request hits `proxy.ts`, which refreshes the Supabase session and redirects unauthenticated users away from protected routes.
2. A Server Component renders and reads data directly with `db` (Drizzle) or the Supabase server client.
3. A user action submits a form to a Server Action (`"use server"`), which validates input, writes through `db`, then calls `revalidatePath` so the page reflects the change.

Server vs client:

- Everything is a Server Component by default. Add `"use client"` only for interactivity (state, effects, event handlers, browser APIs).
- Keep client components small and at the leaves of the tree. Fetch on the server and pass data down as props.
- Never import a server-only module (`db`, `env`, `lib/supabase/server`) into a client component.

Data flow:

- Reads: Server Component, then `db` or the Supabase server client, then render.
- Writes: Server Action, then `db`, then `revalidatePath` or `redirect`.
- Route Handlers (`api/`) are only for webhooks, third-party callers, and streaming, not for your own UI reads.

## Where things go

| You need to add                 | Put it in                                                                |
| ------------------------------- | ------------------------------------------------------------------------ |
| A page                          | `src/app/<route>/page.tsx` (Server Component)                            |
| A protected page                | a route under a prefix in `proxy.ts` `protectedPaths`                    |
| A form mutation                 | a Server Action in `actions.ts` next to the route                        |
| A webhook or streaming endpoint | `src/app/api/<name>/route.ts`                                            |
| A database table                | `src/db/schema.ts`, then a migration                                     |
| A reusable query                | `src/db/queries/<name>.ts` (server-only)                                 |
| A UI primitive (button, dialog) | `npx shadcn@latest add <name>`, lands in `components/ui`                 |
| A composed feature component    | `src/components/<feature>/`                                              |
| A shared helper or hook         | `src/lib/`                                                               |
| Project name, brand, base URL   | `src/config/site.ts`                                                     |
| An environment variable         | `src/lib/env.ts` (server) or `NEXT_PUBLIC_` (client), and `.env.example` |

## Commands

Use **npm**.

```bash
npm run setup        # one-command install on a fresh machine (deps + env file)
npm run init-project # set name, description, brand for a new project
npm run dev          # local dev server (Turbopack)
npm run build        # production build
npm run typecheck    # tsc --noEmit, run before declaring work done
npm run lint         # eslint
npm run format       # prettier --write .
npm run db:generate  # generate SQL migration from src/db/schema.ts
npm run db:migrate   # apply migrations
npm run db:push      # push schema straight to the DB (good for prototyping)
npm run db:studio    # open Drizzle Studio
```

After any code change, run `npm run typecheck` and `npm run lint`.

## Environment

- Config lives in `.env` (gitignored). This project does not use `.env.local`.
- `.env.example` is the tracked template. Keep it in sync when adding a variable.
- Never commit `.env`, print secrets, or expose a non-`NEXT_PUBLIC_` variable to client code.
- Server vars are validated once in `src/lib/env.ts`; a missing or invalid var fails fast with a clear message. Add new server vars there. Public vars use the `NEXT_PUBLIC_` prefix and are read directly from `process.env`.

## Folder structure

```
src/
  app/                  # routes (App Router)
    api/chat/route.ts   # AI Gateway endpoint
    login/              # auth: page.tsx (form) + actions.ts (server actions)
    dashboard/          # example protected route
    robots.ts sitemap.ts# SEO
  components/ui/         # shadcn components (generated, edit sparingly)
  config/site.ts        # project name, description, base URL
  db/
    index.ts            # database client
    schema.ts           # Drizzle schema, the source of truth for tables
  lib/
    env.ts              # validated server env
    supabase/           # client.ts (browser) · server.ts · middleware.ts
    utils.ts            # cn()
  proxy.ts              # refreshes auth session + guards private routes (Next 16 convention)
scripts/                # setup.mjs (install) + init-project.mjs (new project)
drizzle/                # generated SQL migrations (do not hand-edit)
```

## Database (Drizzle + Supabase)

- One connection string, `DATABASE_URL`, is used everywhere: the app at runtime and `drizzle-kit` migrations.
- `prepare: false` is set in `src/db/index.ts` so the same URL works with any Supabase connection string, including the transaction pooler, which does not support prepared statements. Do not remove that flag.
- Workflow: edit `src/db/schema.ts`, run `npm run db:generate`, review the SQL in `drizzle/`, then `npm run db:migrate`. For quick prototyping, `npm run db:push`.
- Column naming: write camelCase in the schema; it maps to snake_case columns automatically (`casing: "snake_case"`). Do not rename existing columns casually, it breaks data.
- Row Level Security: Supabase tables are exposed via PostgREST. Enable RLS and write policies for any table holding user data. Drizzle runs server-side and bypasses RLS, so keep all DB writes in server code, never in the browser.
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
  - `lib/supabase/client.ts` for Client Components (`"use client"`).
  - `lib/supabase/server.ts` for Server Components, Server Actions, and Route Handlers. It is async (`cookies()` is async in Next 16), so always `await createClient()`.
  - `lib/supabase/middleware.ts` is the session refresh helper, called from `src/proxy.ts`.
- For authorization in server code, use `getUser()` (it revalidates against Supabase), not `getSession()`.
- In `proxy.ts`, keep the code between `createServerClient` and `getUser()` empty. Inserting logic there causes random logouts.
- Add private routes by extending `protectedPaths` in `lib/supabase/middleware.ts`.

## UI (shadcn/ui + Tailwind v4)

- Add components with `npx shadcn@latest add <name>`. They land in `src/components/ui/`.
- For a link styled as a button, apply `buttonVariants({ ... })` to a `<Link>` (a real anchor). Do not wrap a `<Link>` in `<Button>`: this Button is built on Base UI and expects a native `<button>`, so a non-button render breaks accessibility and warns in the console.
- Theming is CSS variables in `src/app/globals.css` (oklch). The brand accent (`--primary`, `--ring`) is blue `#3b82f6`. Adjust tokens there, not per component.
- Compose classes with `cn()` from `@/lib/utils`. Tailwind v4 has no `tailwind.config.js`; configure via `@theme` in `globals.css`.
- RTL: the default is LTR. For a Hebrew or RTL site, set `<html dir="rtl">` in `layout.tsx`; Tailwind logical utilities and shadcn handle the rest.

## AI (Vercel AI Gateway)

- Use the `ai` package. Pass the model as a `"<provider>/<model>"` string (for example `"openai/gpt-4o-mini"` or `"anthropic/claude-sonnet-4.5"`); with `AI_GATEWAY_API_KEY` set, requests route through the gateway, with no per-provider keys.
- Example endpoint: `src/app/api/chat/route.ts` (`generateText`). To stream, switch to `streamText` plus `toUIMessageStreamResponse()`. Default model is `AI_DEFAULT_MODEL`.

## SEO / GEO

- Per-page metadata via the `metadata` export. The defaults (title template, OpenGraph) live in `layout.tsx` and read from `src/config/site.ts`.
- `robots.ts`, `sitemap.ts`, and `public/llms.txt` exist. Update them as routes change. `llms.txt` helps AI search engines; replace its placeholder copy per project.

## Clean code

- One responsibility per file and per function. If a file mixes concerns or passes about 200 lines, split it.
- Name by intent, no abbreviations. Booleans read as predicates (`isLoading`, `hasAccess`, `canEdit`).
- Validate at every boundary with `zod`: form input, request bodies, env. Trust internal types after the boundary.
- Keep components presentational. Push data access and business rules into `db/` and `lib/`.
- Handle errors explicitly. Return a typed result or a clear message from actions; do not swallow errors. The one documented exception is the cookie `setAll` no-op in `lib/supabase/server.ts`.
- TypeScript `strict`. No `any` without a comment explaining why.
- Async correctness in Next 16: `await createClient()`, and `await` the `params` and `searchParams` props, which are Promises.
- Server-first: keep data fetching and secrets in Server Components, Actions, and Route Handlers. Add `"use client"` only when you need interactivity.
- Reuse before you abstract, but do not over-abstract. Extract a shared piece on the third repeat, not the first.
- Accessibility is part of done: label inputs, use semantic elements, keep it keyboard-navigable.
- Comments explain why, not what. Delete dead code instead of commenting it out.
- Run `npm run format`, `npm run typecheck`, and `npm run lint` before calling work done.

## Guardrails, do not

- Commit `.env` or any secret; log credentials; or read service-role keys into client code.
- Remove `prepare: false` from `src/db/index.ts`.
- Put database writes or secret keys in Client Components.
- Hand-edit files in `drizzle/` (generated) or rewrite generated `components/ui` wholesale.
- Run destructive DB commands (`db:push` against production, `DROP`, truncate) without explicit confirmation.

## Start a new project

From a fresh clone:

1. `npm run setup` to install dependencies and create `.env`.
2. Fill `.env` with your Supabase and AI Gateway values.
3. `npm run init-project` to set the project name, description, and slug (or edit `src/config/site.ts`). Set the brand color in `src/app/globals.css` (`--primary`).
4. Define your tables in `src/db/schema.ts`, then `npm run db:push`.
5. Replace `src/app/page.tsx` and `public/llms.txt` with your content.
6. `npm run dev`.

## Install on another machine

Anything with Node 20+ and git:

```bash
git clone <your-repo-url> my-app
cd my-app
npm run setup
```

`npm run setup` installs dependencies and creates `.env` from the template, then prints what to fill in. It is safe to re-run.

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add every variable from `.env.example` in Project, Settings, Environment Variables.
3. AI Gateway works automatically on Vercel; locally it needs `AI_GATEWAY_API_KEY`.
4. Build command `npm run build`, output is detected automatically.
