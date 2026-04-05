import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { foreignKey, index, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
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
    user_id: uuid("user_id").notNull(),
    role_id: uuid("role_id").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.user_id, table.role_id],
      name: "UserRoles_pkey",
    }),
    user_id_fk: foreignKey({
      columns: [table.user_id],
      foreignColumns: [users.user_id],
      name: "UserRoles_user_id_fkey",
    }).onDelete("cascade"),
    role_id_fk: foreignKey({
      columns: [table.role_id],
      foreignColumns: [roles.role_id],
      name: "UserRoles_role_id_fkey",
    }).onDelete("cascade"),
    role_id_idx: index("UserRoles_role_id_idx").using("btree", table.role_id),
    user_id_idx: index("UserRoles_user_id_idx").using("btree", table.user_id),
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
