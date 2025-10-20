import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, primaryKey, text, uuid, varchar } from "drizzle-orm/pg-core";
import { rolePermissions } from "./rolePermissions";
import { users } from "./users";

export const roles = pgTable("Roles", {
  role_id: uuid("role_id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  disabled: boolean("disabled").notNull(),
  description: text("description"),
});

// Export types for use in other schema files
export type Role = InferSelectModel<typeof roles>;

/**
 * Permissions schema moved to ./permissions
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
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.role_id] }),
    };
  },
);

/**
 * RolePermissions schema moved to ./rolePermissions
 */

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

// Define relations to users
export const usersToRolesRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

/**
 * Permissions relations are defined in ./permissions
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

/**
 * RolePermissions relations are defined in ./rolePermissions
 */
