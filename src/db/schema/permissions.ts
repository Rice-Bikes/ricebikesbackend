import { relations } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { rolePermissions } from "./rolePermissions";
/**
 * Permissions schema
 *
 * Matches the database DDL:
 * - id: integer primary key with sequence (auto-increment)
 * - name: varchar(255) not null
 * - description: text (nullable)
 */
export const permissions = pgTable("Permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
});

// Export select type
export type Permission = InferSelectModel<typeof permissions>;

/**
 * Relations
 * - Permissions have many RolePermissions mappings
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));
