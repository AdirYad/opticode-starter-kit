import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Database client used everywhere in the app.
 *
 * `prepare: false` keeps this compatible with any Supabase connection string,
 * including the transaction pooler, which does not support prepared statements.
 * It is safe to leave on for direct connections too.
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
