import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * `cookies()` is async in Next.js 16, so this helper is async too.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // setAll was called from a Server Component. This can be ignored
          // because the middleware (updateSession) refreshes the session.
        }
      },
    },
  });
}
