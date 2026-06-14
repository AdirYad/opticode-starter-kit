import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * App-runtime database client.
 *
 * Uses Supabase's pooled "Transaction" connection (DATABASE_URL, port 6543),
 * which does NOT support prepared statements — hence `prepare: false`.
 * Migrations use a different (direct) connection; see drizzle.config.ts.
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
