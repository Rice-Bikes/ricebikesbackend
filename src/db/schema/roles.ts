import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { boolean, integer, pgTable, primaryKey, text, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const roles = pgTable("Roles", {
  role_id: uuid("role_id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
  disabled: boolean("disabled").notNull(),
  description: text("description"),
});

// Export types for use in other schema files
export type Role = InferSelectModel<typeof roles>;

export const permissions = pgTable("Permissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: varchar("name").notNull().unique(),
  description: text("description").notNull(),
});

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

export const rolePermissions = pgTable(
  "RolePermissions",
  {
    role_id: uuid("role_id")
      .notNull()
      .references(() => roles.role_id, { onDelete: "cascade" }),
    permission_id: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.role_id, table.permission_id] }),
    };
  },
);

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

// Define relations to users
export const usersToRolesRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

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

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.role_id],
    references: [roles.role_id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permission_id],
    references: [permissions.id],
  }),
}));
