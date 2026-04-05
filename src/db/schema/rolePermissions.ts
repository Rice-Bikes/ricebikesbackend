import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { foreignKey, index, integer, pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { permissions } from "./permissions";
import { roles } from "./roles";

/**
 * RolePermissions join table schema
 *
 * Matches the database DDL:
 * - role_id: uuid NOT NULL, FK -> Roles.role_id
 * - permission_id: integer NOT NULL, FK -> Permissions.id
 * - Composite primary key: (role_id, permission_id)
 */
export const rolePermissions = pgTable(
  "RolePermissions",
  {
    role_id: uuid("role_id").notNull(),
    permission_id: integer("permission_id").notNull(),
  },
  (table) => {
    return {
      permission_id_fk: foreignKey({
        columns: [table.permission_id],
        foreignColumns: [permissions.id],
        name: "RolePermissions_permission_id_fkey",
      }).onDelete("cascade"),
      role_id_fk: foreignKey({
        columns: [table.role_id],
        foreignColumns: [roles.role_id],
        name: "RolePermissions_role_id_fkey",
      }).onDelete("cascade"),
      pk: primaryKey({
        columns: [table.role_id, table.permission_id],
        name: "RolePermissions_pkey",
      }),
      permissions_id_idx: index("RolePermissions_permission_id_idx").using("btree", table.permission_id),
      role_id_idx: index("RolePermissions_role_id_idx").using("btree", table.role_id),
    };
  },
);

// Export select type
export type RolePermission = InferSelectModel<typeof rolePermissions>;

/**
 * Relations
 * - Each RolePermission belongs to one Role
 * - Each RolePermission belongs to one Permission
 */
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
