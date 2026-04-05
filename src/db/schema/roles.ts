import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { rolePermissions } from "./rolePermissions";
import { users } from "./users";

export const roles = pgTable("Roles", {
  role_id: uuid("role_id").primaryKey(),
  name: text("name"),
  disabled: boolean("disabled").notNull(),
  description: text("description"),
});

// Export types for use in other schema files
export type Role = InferSelectModel<typeof roles>;

/**
 * Permissions schema moved to ./permissions
 */

// export const userRoles = pgTable(
//   "UserRoles",
//   {
//     user_id: uuid("user_id")
//       .notNull()
//       .references(() => users.user_id, {
//         name: "UserRoles_user_id_fkey",
//         onDelete: "cascade",
//       }),
//     role_id: uuid("role_id")
//       .notNull()
//       .references(() => roles.role_id, {
//         name: "UserRoles_role_id_fkey",
//         onDelete: "cascade",
//       }),
//   },
//   (table) => {
//     return {
//       role_id_idx: index("UserRoles_role_id_idx").using(
//         "btree",
//         table.role_id.asc().nullsLast().op("uuid_ops"),
//       ),
//       user_id_idx: index("UserRoles_user_id_idx").using(
//         "btree",
//         table.user_id.asc().nullsLast().op("uuid_ops"),
//       ),
//       pk: primaryKey({
//         columns: [table.user_id, table.role_id],
//         name: "UserRoles_pkey",
//       }),
//     };
//   },
// );

/**
 * RolePermissions schema moved to ./rolePermissions
 */

export const rolesRelations = relations(roles, ({ many }) => ({
  // userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

// // Define relations to users
// export const usersToRolesRelations = relations(users, ({ many }) => ({
//   userRoles: many(userRoles),
// }));

/**
 * Permissions relations are defined in ./permissions
 */

// export const userRolesRelations = relations(userRoles, ({ one }) => ({
//   user: one(users, {
//     fields: [userRoles.user_id],
//     references: [users.user_id],
//   }),
//   role: one(roles, {
//     fields: [userRoles.role_id],
//     references: [roles.role_id],
//   }),
// }));

/**
 * RolePermissions relations are defined in ./rolePermissions
 */
