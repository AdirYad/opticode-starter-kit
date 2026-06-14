import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Drizzle schema. Column names are written in camelCase here and mapped to
 * snake_case in the database via the `casing: "snake_case"` option (see
 * drizzle.config.ts and src/db/index.ts).
 *
 * `profiles.id` is meant to equal `auth.users.id` from Supabase Auth. Create
 * the row on signup with a Postgres trigger (see AGENTS.md).
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Example domain table, owned by a profile. Replace with your own. */
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
