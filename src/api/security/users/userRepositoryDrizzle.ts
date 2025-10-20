import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { permissions, rolePermissions, roles, userRoles, users } from "@/db/schema";

/**
 * User Repository Implementation with Drizzle ORM
 */
import { and, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Permission } from "../permissions/permissionModel";
import type { User, UserRole } from "./userModel";

export class UsersRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
    logger.debug("UsersRepositoryDrizzle initialized");
  }

  async findAllAsync(): Promise<User[]> {
    try {
      logger.debug("Finding all users");
      return this.db.select().from(users);
    } catch (error) {
      logger.error({ error }, "Error finding all users");
      throw error;
    }
  }

  async findByIdAsync(username: string): Promise<User | null> {
    try {
      logger.debug({ username }, "Finding user by username");

      // First get the user
      const userResult = await this.db
        .select()
        .from(users)
        .where(and(eq(users.username, username), eq(users.active, true)));

      if (userResult.length === 0) {
        return null;
      }

      const user = userResult[0];

      // Then get user roles with permissions
      const userRolesResult = await this.db
        .select({
          role: roles,
          permission: {
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
          },
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.role_id, roles.role_id))
        .innerJoin(rolePermissions, eq(roles.role_id, rolePermissions.role_id))
        .innerJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
        .where(and(eq(userRoles.user_id, user.user_id), eq(roles.disabled, false)));

      // Process the roles and permissions
      const roleMap = new Map();
      const permissionSet = new Set<Permission>();

      userRolesResult.forEach((row: any) => {
        // Add role to map
        roleMap.set(row.role.role_id, {
          role_id: row.role.role_id,
          name: row.role.name,
          description: row.role.description,
          disabled: row.role.disabled,
        });

        // Add permission to set - map to match Permission schema
        permissionSet.add({
          id: row.permission.id,
          name: row.permission.name,
          description: row.permission.description,
        });
      });

      // Construct the final user object
      return {
        user_id: user.user_id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        active: user.active,
        permissions: Array.from(permissionSet) as Permission[],
      };
    } catch (error) {
      logger.error({ error, username }, "Error finding user by username");
      throw error;
    }
  }

  async create(userData: User): Promise<User> {
    try {
      logger.debug({ userData: { ...userData, password: "[REDACTED]" } }, "Creating new user");
      const result = await this.db
        .insert(users)
        .values({
          firstname: userData.firstname,
          lastname: userData.lastname,
          username: userData.username,
          active: userData.active !== undefined ? userData.active : true,
        })
        .returning();

      logger.debug({ userId: result[0].user_id }, "User created successfully");
      return result[0];
    } catch (error) {
      logger.error({ error }, "Error creating user");
      throw error;
    }
  }

  async update(id: string, userData: User): Promise<User> {
    try {
      logger.debug(
        {
          userId: id,
          updateData: {
            ...userData,
          },
        },
        "Updating user",
      );
      const result = await this.db
        .update(users)
        .set({
          firstname: userData.firstname,
          lastname: userData.lastname,
          username: userData.username,
          active: userData.active,
        })
        .where(eq(users.user_id, id))
        .returning();

      if (result.length === 0) {
        throw new Error(`User with id ${id} not found`);
      }

      return result[0];
    } catch (error) {
      logger.error({ error, userId: id }, "Error updating user");
      throw error;
    }
  }

  async delete(id: string): Promise<User> {
    try {
      logger.debug({ userId: id }, "Deleting user");

      // First remove all user roles
      await this.db.delete(userRoles).where(eq(userRoles.user_id, id)).execute();

      // Then delete the user
      const result = await this.db.delete(users).where(eq(users.user_id, id)).returning();

      if (result.length === 0) {
        throw new Error(`User with id ${id} not found`);
      }

      logger.debug({ userId: id }, "User deletion successful");
      return result[0];
    } catch (error) {
      logger.error({ error, userId: id }, "Error deleting user");
      throw error;
    }
  }

  async attachRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    try {
      logger.debug({ userId, roleId }, "Attaching role to user");
      const result = await this.db
        .insert(userRoles)
        .values({
          user_id: userId,
          role_id: roleId,
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error({ error, userId, roleId }, "Error attaching role to user");
      throw error;
    }
  }

  async detachRoleFromUser(userId: string, roleId: string): Promise<UserRole> {
    try {
      logger.debug({ userId, roleId }, "Detaching role from user");
      const result = await this.db
        .delete(userRoles)
        .where(and(eq(userRoles.user_id, userId), eq(userRoles.role_id, roleId)))
        .returning();

      if (result.length === 0) {
        throw new Error(`UserRole not found for user ${userId} and role ${roleId}`);
      }

      return result[0];
    } catch (error) {
      logger.error({ error, userId, roleId }, "Error detaching role from user");
      throw error;
    }
  }
}
