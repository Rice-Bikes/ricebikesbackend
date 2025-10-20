import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { users } from "./users";

/**
 * UserRoles join table schema
 *
 * Matches the Prisma model:
 * model UserRoles {
 *   user_id String @db.Uuid
 *   role_id String @db.Uuid
 *   User    Users  @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
 *   Role    Roles  @relation(fields: [role_id], references: [role_id], onDelete: Cascade)
 *
 *   @@id([user_id, role_id])
 * }
 */
export const userRoles = pgTable(
  "UserRoles",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.user_id, { onDelete: "cascade" }),
    role_id: uuid("role_id")
      .notNull()
      .references(() => roles.role_id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.role_id] }),
  }),
);

// Export select type
export type UserRole = InferSelectModel<typeof userRoles>;

/**
 * Relations
 * - Each UserRole belongs to one User
 * - Each UserRole belongs to one Role
 */
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.user_id],
    references: [users.user_id],
  }),
  role: one(roles, {
    fields: [userRoles.role_id],
    references: [roles.role_id],
  }),
}));
