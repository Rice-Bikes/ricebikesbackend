import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidv4 } from "uuid";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { rolePermissions as rolePermissionsTable } from "@/db/schema/rolePermissions";
import { roles as rolesTable } from "@/db/schema/roles";
import { userRoles as userRolesTable } from "@/db/schema/userRoles";

import type { Role, RolePermissions } from "./roleModel";

/**
 * Roles Repository - Drizzle Implementation
 *
 * Mirrors the style and structure of ItemRepositoryDrizzle:
 * - typed Drizzle db from '@/db/client'
 * - schema table imports
 * - logger usage
 * - try/catch with logs
 * - helper mappers
 */
export class RolesRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Find all roles
   */
  async findAllAsync(): Promise<Role[]> {
    try {
      logger.debug("Finding all roles");

      const rows = await this.db.select().from(rolesTable);
      return rows.map((r) => this.mapToRole(r));
    } catch (error) {
      logger.error({ error }, "Error finding all roles");
      throw error;
    }
  }

  /**
   * Find roles for a given username (user_id)
   */
  async findByIdAsync(username: string): Promise<Role[] | null> {
    try {
      logger.debug({ username }, "Finding roles by username");

      const rows = await this.db
        .select()
        .from(userRolesTable)
        .leftJoin(rolesTable, eq(userRolesTable.role_id, rolesTable.role_id))
        .where(eq(userRolesTable.user_id, username));
      logger.debug({ rows }, "Roles query result");
      const roles = rows.map((role) => this.mapToRole(role));
      logger.debug({ roles }, "Mapped roles");
      return roles.length > 0 ? roles : null;
    } catch (error) {
      logger.error({ error, username }, "Error finding roles by username");
      throw error;
    }
  }

  /**
   * Create a new role
   * Note: Keeps signature compatible with existing usage (expects Role).
   */
  async create(role: Role): Promise<Role> {
    try {
      logger.debug({ role }, "Creating new role");

      const roleId = role.role_id || uuidv4();
      const newRole = { ...role, role_id: roleId };

      await this.db.insert(rolesTable).values(newRole);

      const created = await this.findRoleByIdAsync(roleId);
      if (!created) {
        const error = new Error("Role creation failed: role not found after insert");
        logger.error({ error, roleId }, "Role creation verification failed");
        throw error;
      }

      logger.debug({ roleId }, "Role created successfully");
      return created;
    } catch (error) {
      logger.error({ error, role }, "Error creating role");
      throw error;
    }
  }

  /**
   * Update an existing role
   * Note: Keeps signature compatible with existing usage (expects Role).
   * Behavior mirrors Prisma's update semantics (throws if not found).
   */
  async update(id: string, role: Role): Promise<Role> {
    try {
      logger.debug({ roleId: id, role }, "Updating role");

      const existing = await this.findRoleByIdAsync(id);
      if (!existing) {
        const error = new Error("Role not found");
        logger.warn({ roleId: id }, "Attempted to update non-existent role");
        throw error;
      }

      await this.db.update(rolesTable).set(role).where(eq(rolesTable.role_id, id));

      const updated = await this.findRoleByIdAsync(id);
      if (!updated) {
        const error = new Error("Role update failed: role not found after update");
        logger.error({ error, roleId: id }, "Role update verification failed");
        throw error;
      }

      logger.debug({ roleId: id }, "Role updated successfully");
      return updated;
    } catch (error) {
      logger.error({ error, roleId: id, role }, "Error updating role");
      throw error;
    }
  }

  /**
   * Delete a role (hard delete, to mirror previous Prisma behavior)
   * Behavior mirrors Prisma's delete semantics (throws if not found).
   */
  async delete(id: string): Promise<Role> {
    try {
      logger.debug({ roleId: id }, "Deleting role");

      const existing = await this.findRoleByIdAsync(id);
      if (!existing) {
        const error = new Error("Role not found");
        logger.warn({ roleId: id }, "Attempted to delete non-existent role");
        throw error;
      }

      await this.db.delete(rolesTable).where(eq(rolesTable.role_id, id));

      logger.debug({ roleId: id }, "Role deleted successfully");
      return existing;
    } catch (error) {
      logger.error({ error, roleId: id }, "Error deleting role");
      throw error;
    }
  }

  /**
   * Attach a permission to a role
   */
  async attachPermissionToRole(roleId: string, permission_id: number): Promise<RolePermissions> {
    try {
      logger.debug({ roleId, permission_id }, "Attaching permission to role");

      const permission: typeof rolePermissionsTable.$inferInsert = {
        role_id: roleId,
        permission_id,
      };

      await this.db.insert(rolePermissionsTable).values(permission);

      // Verify insert
      const rows = await this.db
        .select()
        .from(rolePermissionsTable)
        .where(and(eq(rolePermissionsTable.role_id, roleId), eq(rolePermissionsTable.permission_id, permission_id)));

      if (!rows || rows.length === 0) {
        const error = new Error("Failed to attach permission to role");
        logger.error({ error, roleId, permission_id }, "Attach permission verification failed");
        throw error;
      }

      logger.debug({ roleId, permission_id }, "Permission attached to role");
      return this.mapToRolePermissions(rows[0]);
    } catch (error) {
      logger.error({ error, roleId, permission_id }, "Error attaching permission to role");
      throw error;
    }
  }

  /**
   * Detach a permission from a role
   * Behavior mirrors Prisma's delete semantics (throws if not found).
   */
  async detachPermissionFromRole(roleId: string, permission_id: number): Promise<RolePermissions> {
    try {
      logger.debug({ roleId, permission_id }, "Detaching permission from role");

      // Find existing mapping to return after delete
      const rows = await this.db
        .select()
        .from(rolePermissionsTable)
        .where(and(eq(rolePermissionsTable.role_id, roleId), eq(rolePermissionsTable.permission_id, permission_id)));

      if (!rows || rows.length === 0) {
        const error = new Error("Role permission mapping not found");
        logger.warn({ roleId, permission_id }, "Attempted to detach non-existent permission mapping");
        throw error;
      }

      const existing = this.mapToRolePermissions(rows[0]);

      await this.db
        .delete(rolePermissionsTable)
        .where(and(eq(rolePermissionsTable.role_id, roleId), eq(rolePermissionsTable.permission_id, permission_id)));

      logger.debug({ roleId, permission_id }, "Permission detached from role");
      return existing;
    } catch (error) {
      logger.error({ error, roleId, permission_id }, "Error detaching permission from role");
      throw error;
    }
  }

  /**
   * Helper: Find a role by role_id
   */
  private async findRoleByIdAsync(roleId: string): Promise<Role | null> {
    const rows = await this.db.select().from(rolesTable).where(eq(rolesTable.role_id, roleId));
    if (!rows || rows.length === 0) {
      return null;
    }
    return this.mapToRole(rows[0]);
  }

  /**
   * Helper: Map DB record to Role model
   */
  private mapToRole(record: any): Role {
    if (!record) {
      throw new Error("Cannot map null or undefined record to Role");
    }
    // Minimal normalization: ensure role_id is a string
    return record.Roles as Role;
  }

  /**
   * Helper: Map DB record to RolePermissions model
   */
  private mapToRolePermissions(record: any): RolePermissions {
    if (!record) {
      throw new Error("Cannot map null or undefined record to RolePermissions");
    }
    return {
      ...record,
      role_id: String(record.role_id),
      permission_id: Number(record.permission_id),
    } as RolePermissions;
  }
}

// Alias to preserve potential existing imports while mirroring ItemRepositoryDrizzle naming
export { RolesRepositoryDrizzle as RolesRepository };
