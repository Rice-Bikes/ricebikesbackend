import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { permissions as permissionsTable } from "@/db/schema/permissions";
import { rolePermissions as rolePermissionsTable } from "@/db/schema/rolePermissions";
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Permission as PermissionModel } from "./permissionModel";

export class PermissionsRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = drizzleDb) {
    this.db = dbInstance;
  }

  /**
   * Map a DB record to the API Permission model
   */
  private mapToPermission(record: any): PermissionModel {
    if (!record) {
      throw new Error("Cannot map null or undefined record to Permission");
    }

    return {
      id: Number(record.id),
      name: record.name,
      // Ensure we always return a string per the API model
      description: record.description ?? "",
    };
  }

  /**
   * Retrieve all permissions
   */
  async findAllAsync(): Promise<PermissionModel[]> {
    try {
      const rows = await this.db.select().from(permissionsTable);
      return rows.map((r) => this.mapToPermission(r));
    } catch (error) {
      logger.error(`[PermissionsRepository] findAllAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve a permission by id
   */
  async findByIdAsync(id: number): Promise<PermissionModel | null> {
    try {
      const rows = await this.db.select().from(permissionsTable).where(eq(permissionsTable.id, id)).limit(1);

      return rows.length > 0 ? this.mapToPermission(rows[0]) : null;
    } catch (error) {
      logger.error(`[PermissionsRepository] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Retrieve permissions for a given role by role_id
   */
  async findByRoleIdAsync(roleId: string): Promise<PermissionModel[] | null> {
    try {
      const rows = await this.db
        .select({
          permission: permissionsTable,
        })
        .from(rolePermissionsTable)
        .innerJoin(permissionsTable, eq(rolePermissionsTable.permission_id, permissionsTable.id))
        .where(eq(rolePermissionsTable.role_id, roleId));

      if (rows.length === 0) return null;

      return rows.map((r) => this.mapToPermission(r.permission));
    } catch (error) {
      logger.error(`[PermissionsRepository] findByRoleIdAsync error (roleId=${roleId}): ${error}`);
      throw error;
    }
  }

  /**
   * Create a permission
   * Note: DB will auto-generate the id (sequence) if configured at the DB level.
   */
  async create(permission: PermissionModel): Promise<PermissionModel> {
    try {
      const toInsert = {
        name: permission.name,
        description: permission.description,
      };

      const result = await this.db.insert(permissionsTable).values(toInsert).returning();

      if (result.length === 0) {
        throw new Error("Failed to insert Permission");
      }

      return this.mapToPermission(result[0]);
    } catch (error) {
      logger.error({ error, permission }, "[PermissionsRepository] create error");
      throw error;
    }
  }

  /**
   * Update a permission by id
   */
  async update(id: number, permission: PermissionModel): Promise<PermissionModel | null> {
    try {
      const updateData = {
        name: permission.name,
        description: permission.description,
      };

      const result = await this.db
        .update(permissionsTable)
        .set(updateData)
        .where(eq(permissionsTable.id, id))
        .returning();

      if (result.length === 0) {
        return null;
      }

      return this.mapToPermission(result[0]);
    } catch (error) {
      logger.error({ error, id, permission }, "[PermissionsRepository] update error");
      throw error;
    }
  }

  /**
   * Delete a permission by id
   */
  async delete(id: number): Promise<PermissionModel | null> {
    try {
      const result = await this.db.delete(permissionsTable).where(eq(permissionsTable.id, id)).returning();

      if (result.length === 0) {
        return null;
      }

      return this.mapToPermission(result[0]);
    } catch (error) {
      logger.error({ error, id }, "[PermissionsRepository] delete error");
      throw error;
    }
  }
}
