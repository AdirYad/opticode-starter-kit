# Project guide

Guidance for any AI agent (and humans) working in this repository. Read this before making changes. The goal is the cleanest, simplest correct code, so follow the architecture and conventions below rather than inventing your own. When you change a convention, update this file in the same change so it never drifts from the code.

## What this is

A production-grade starter for building real web apps. The stack is fixed and opinionated, so do not swap core pieces without being asked.

| Layer     | Choice                                                         |
| --------- | -------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router, React 19, Turbopack)               |
| UI        | **shadcn/ui** on **Tailwind CSS v4** (CSS-first, oklch tokens) |
| Database  | **Supabase** Postgres via **Drizzle ORM** (`postgres-js`)      |
| Auth      | **Supabase Auth** via `@supabase/ssr` (cookie sessions)        |
| AI        | **Vercel AI Gateway** via the **AI SDK** (`ai`)                |
| Email     | **Resend** (transactional, optional)                           |
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
npm run setup        # install deps, then fill .env interactively (fresh machine)
npm run init-project # set name, description, brand for a new project
npm run env          # fill or update .env interactively (asks for each variable)
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

A Husky `pre-commit` hook runs `lint-staged`, which auto-fixes staged files with `eslint --fix` then `prettier --write`. It installs on `npm install` (the `prepare` script), so commits stay formatted and linted with no extra steps.

## Environment

- Config lives in `.env` (gitignored). This project does not use `.env.local`.
- `.env.example` is the tracked template. Keep it in sync when adding a variable.
- Run `npm run env` to fill or update `.env` interactively: it reads `.env.example`, asks for each variable with its inline help, and keeps existing answers as defaults.
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
- Workflow: edit `src/db/schema.ts`, run `npm run db:generate`, review the SQL in `drizzle/`, then `npm run db:migrate`. `db:push` skips the migration file; use it only against your local scratch DB, never anywhere shared (staging, prod, a teammate's machine).
- Column naming: write camelCase in the schema; it maps to snake_case columns automatically (`casing: "snake_case"`). Do not rename existing columns casually, it breaks data.
- Row Level Security: Supabase tables are exposed via PostgREST. Enable RLS and write policies for any table holding user data. Drizzle runs server-side and bypasses RLS, so keep all DB writes in server code, never in the browser.
- Schema is the single source of truth for types. Derive row and insert types with `typeof table.$inferSelect` and `typeof table.$inferInsert`; never hand-write a parallel `interface` that can drift.
- Select only the columns you need (`db.select({ id: t.id, ... })` or `columns` in the query API), not the whole row. It is faster and avoids leaking columns you did not intend to expose.
- Wrap multi-statement writes in `db.transaction(async (tx) => { ... })` so a partial failure rolls back. Never fire a sequence of dependent writes without one.
- Index columns you filter, join, or order by, especially every foreign key. Declare the index in `schema.ts` with `index()`, then generate and migrate.
- Migrations are immutable history. Generate, review the SQL, and commit it alongside the schema change. Never edit or delete a migration that has run anywhere shared; write a new one to change course.
- Make the DB guarantee shape, not the app: use `notNull()`, sensible `default`s, and `timestamp(..., { withTimezone: true }).defaultNow()`. Set `references(() => other.id, { onDelete: "cascade" })` deliberately, deciding cascade vs restrict per relation.
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
- Authentication is not authorization. `getUser()` tells you who the caller is; you still have to check what they may touch. The proxy guards navigation, not individual mutations, so re-check in every Server Action: call `getUser()`, then scope the query to that user's id and verify ownership. A valid session does not by itself grant access to a given row.
- The anon key is the only Supabase key that may reach the browser. The service-role key bypasses RLS, so keep it server-only and use it sparingly, never in a Client Component.
- In `proxy.ts`, keep the code between `createServerClient` and `getUser()` empty. Inserting logic there causes random logouts.
- Add private routes by extending `protectedPaths` in `lib/supabase/middleware.ts`.

## UI (shadcn/ui + Tailwind v4)

shadcn/ui:

- Add components with `npx shadcn@latest add <name>`. They land in `src/components/ui/`.
- You own the generated code, but treat `components/ui` as close to upstream. Re-running `add` overwrites a file, so customize through composition (wrap a primitive in a feature component) rather than editing `ui/`. When you must touch a primitive, keep the change small and comment why.
- New visual variants belong in the component's `cva` config (the `*Variants` object), not as one-off `className` overrides scattered across the app. Define a variant once, reuse it everywhere.
- For a link styled as a button, apply `buttonVariants({ ... })` to a `<Link>` (a real anchor). Do not wrap a `<Link>` in `<Button>`: this Button is built on Base UI and expects a native `<button>`, so a non-button render breaks accessibility and warns in the console. When you genuinely need Button semantics on another element, use the `asChild` (Slot) prop, which is the supported polymorphic form.
- Forms: see the Validation section. One zod schema, React Hook Form + `zodResolver` on the client, the same schema re-checked in the Server Action.
- Toasts: use Sonner (`sonner`), the current shadcn toast. `<Toaster richColors />` is mounted in `layout.tsx`; trigger with `import { toast } from "sonner"`.
- Dark mode is wired via next-themes: `Providers` in `layout.tsx` (class strategy, system default), with a `ThemeToggle` component. Switch via the toggle or `useTheme()`, and rely on tokens so both modes work for free.
- Do not strip the built-in `aria-*`, focus rings, or `sr-only` labels when restyling. Accessibility ships with the primitive; keep it. Icons come from `lucide-react`.

Tailwind v4:

- Style with semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`), never raw colors or arbitrary hex (`bg-[#3b82f6]`). Tokens flip for dark mode and theming for free.
- Theming is CSS variables in `src/app/globals.css` (oklch). The brand accent (`--primary`, `--ring`) is blue `#3b82f6`. Adjust tokens there, not per component. Tailwind v4 has no `tailwind.config.js`; add new tokens via `@theme` in `globals.css`.
- Arbitrary values (`w-[37px]`) are a last resort. Prefer the spacing scale and existing tokens; if a value recurs, promote it to a token.
- Mobile-first: write base styles, then layer `sm: md: lg:`. Do not start at desktop and patch downward.
- RTL-safe by default: use logical utilities (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, `start-0`) instead of left/right ones (`pl-`, `pr-`, `text-left`). They work in both directions with no extra code. For a Hebrew or RTL site, set `<html dir="rtl">` in `layout.tsx` and the rest follows.
- Compose classes with `cn()` from `@/lib/utils`; do not concatenate class strings by hand. Let `prettier-plugin-tailwindcss` order classes, do not fight it.
- Reach for `@apply` rarely (small base resets only). Prefer composing utilities in markup or extracting a component; a wall of `@apply` recreates the CSS files Tailwind exists to avoid.

## AI (Vercel AI Gateway)

- Use the `ai` package. Pass the model as a `"<provider>/<model>"` string (for example `"openai/gpt-4o-mini"` or `"anthropic/claude-sonnet-4.5"`); with `AI_GATEWAY_API_KEY` set, requests route through the gateway, with no per-provider keys.
- Example endpoint: `src/app/api/chat/route.ts` (`generateText`). To stream, switch to `streamText` plus `toUIMessageStreamResponse()`. Default model is `AI_DEFAULT_MODEL`.

## Email (Resend)

- Send transactional email with `sendEmail()` from `src/lib/email.ts` (Resend under the hood). Call it from Server Actions or Route Handlers, never the browser.
- `RESEND_API_KEY` is optional: the app runs without it, and `sendEmail` throws a clear error if called unconfigured. `EMAIL_FROM` must be a verified sender (use `onboarding@resend.dev` in dev, your own domain in prod).

## MCP

- An `.mcp.json` at the repo root registers the **context7** server (live, version-accurate library docs). Claude Code discovers it automatically; approve it on first use. Skills live under `.agents/`; project MCP servers live in `.mcp.json`.

## Validation (zod)

Validate at every boundary. `zod` is the one validation library here, and a schema is the single source of truth for both the runtime shape and its type (`z.infer`). This project is on **zod v4**, so use the top-level format helpers (`z.email()`, `z.uuid()`, `z.url()`), not the deprecated method chains (`z.string().email()`).

The rule that matters most:

- The server is the trust boundary. Always validate on the server, even when the client already validated. Client validation is UX (instant feedback); server validation is security. Never trust client-validated input.

Share one schema across both sides:

- Define the schema in a plain module a client can import, with no server-only imports (no `db`, `lib/env`, or `lib/supabase/server`): `src/lib/validations/<feature>.ts` or a co-located `schema.ts`. Import the same schema in the Server Action and in the form. One schema, two consumers, no drift.

Backend (Server Actions, Route Handlers, env):

- Use `safeParse` for user input so a failure is a value you handle, not a thrown error. Reserve `parse`/throw for cases where failure is a config or programmer error you want to crash on, like `env.ts` at boot.
- `FormData` is all strings. Convert then validate: `schema.safeParse(Object.fromEntries(formData))`. Coerce non-strings with `z.coerce.number()`, `z.coerce.boolean()`.
- Validate request bodies in Route Handlers and webhooks the same way before touching `db`.
- On failure, return a typed result (`{ error: z.flattenError(parsed.error).fieldErrors }`) and read it on the client with `useActionState`; do not throw for expected validation failures. After the boundary, trust `parsed.data` and its inferred type.

Frontend (forms):

- Recommended: React Hook Form + `zodResolver` with the shared schema, for inline field errors as the user types. Not installed yet; add with `npm i react-hook-form @hookform/resolvers` and use shadcn's `Form` primitives.
- The form gives fast feedback only; the Server Action re-validates the same schema and is the authority. Surface server errors back into form state so both layers agree.

One schema feeding both layers:

```ts
// src/lib/validations/auth.ts  (no server-only imports: safe for client)
import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
});

export type Credentials = z.infer<typeof credentialsSchema>;
```

```ts
// src/app/login/actions.ts  (the server is the real boundary)
"use server";
import { credentialsSchema } from "@/lib/validations/auth";

export async function login(_prev: unknown, formData: FormData) {
  const parsed = credentialsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: z.flattenError(parsed.error).fieldErrors };
  }
  // parsed.data is typed and trusted from here on
  // ... sign in with parsed.data.email / parsed.data.password
}
```

Note: today's `login/actions.ts` skips this and passes raw `FormData` straight to Supabase. Wire one feature through this pattern before copying it elsewhere.

## SEO / GEO

- Per-page metadata via the `metadata` export. The defaults (title template, OpenGraph) live in `layout.tsx` and read from `src/config/site.ts`.
- `robots.ts`, `sitemap.ts`, and `public/llms.txt` exist. Update them as routes change. `llms.txt` helps AI search engines; replace its placeholder copy per project.

## Clean code

- One responsibility per file and per function. If a file mixes concerns or passes about 200 lines, split it.
- Name by intent, no abbreviations. Booleans read as predicates (`isLoading`, `hasAccess`, `canEdit`).
- Validate every external boundary with `zod` (form input, request bodies, env); see the Validation section. Trust internal types after the boundary.
- Keep components presentational. Push data access and business rules into `db/` and `lib/`.
- Handle errors explicitly. Return a typed result or a clear message from actions; do not swallow errors. The one documented exception is the cookie `setAll` no-op in `lib/supabase/server.ts`.
- TypeScript `strict`. No `any` without a comment explaining why.
- Async correctness in Next 16: `await createClient()`, and `await` the `params` and `searchParams` props, which are Promises.
- Server-first: data fetching and secrets stay in Server Components, Actions, and Route Handlers.
- Reuse before you abstract, but do not over-abstract. Extract a shared piece on the third repeat, not the first.
- Guard clauses over nesting. Return early on errors and edge cases and keep the happy path at the base indentation, rather than wrapping it in deep `if` blocks.
- Make illegal states unrepresentable. Model variants as discriminated unions (`{ status: "ok"; data } | { status: "error"; message }`) so the compiler forces you to handle each case, instead of optional fields that can combine into nonsense.
- Parallelize independent awaits with `Promise.all`. Do not create request waterfalls by awaiting in series two fetches that do not depend on each other.
- Use the route conventions for UI states: `loading.tsx`, `error.tsx`, `not-found.tsx`, and Suspense boundaries, rather than ad hoc spinners and try/catch in the page body.
- Revalidate precisely after a write. Call `revalidatePath` or `revalidateTag` for the data that actually changed, not a blanket refresh of everything.
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

Anything with Node 20+ and git. `npm run setup` is safe to re-run.

```bash
git clone <your-repo-url> my-app
cd my-app
npm run setup   # installs deps, creates .env from the template, prints what to fill in
```

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add every variable from `.env.example` in Project, Settings, Environment Variables.
3. AI Gateway works automatically on Vercel; locally it needs `AI_GATEWAY_API_KEY`.
4. Build command `npm run build`, output is detected automatically.
