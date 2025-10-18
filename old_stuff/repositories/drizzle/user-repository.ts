import { repositoryLogger as logger } from "@/common/utils/logger";
/**
 * User Repository Implementation with Drizzle ORM
 */
import { eq, sql } from "drizzle-orm";
import { users } from "../../db/schema/users";
import type { DrizzleDB } from "../factory";
import type { User, UserCreateInput, UserRepository, UserUpdateInput } from "../interfaces";

export class UserRepositoryDrizzle implements UserRepository {
  constructor(private readonly db: DrizzleDB) {
    logger.debug("UserRepositoryDrizzle initialized");
  }

  async findAll(): Promise<User[]> {
    try {
      logger.debug("Finding all users");
      return this.db.select().from(users);
    } catch (error) {
      logger.error({ error }, "Error finding all users");
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      logger.debug({ userId: id }, "Finding user by ID");
      const result = await this.db.select().from(users).where(eq(users.user_id, id));

      return result.length ? result[0] : null;
    } catch (error) {
      logger.error({ error, userId: id }, "Error finding user by ID");
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      logger.debug({ username }, "Finding user by username");
      const result = await this.db.select().from(users).where(eq(users.username, username));

      return result.length ? result[0] : null;
    } catch (error) {
      logger.error({ error, username }, "Error finding user by username");
      throw error;
    }
  }

  async findActiveUsers(): Promise<User[]> {
    try {
      logger.debug("Finding active users");
      return this.db.select().from(users).where(eq(users.active, true));
    } catch (error) {
      logger.error({ error }, "Error finding active users");
      throw error;
    }
  }

  async create(data: UserCreateInput): Promise<User> {
    try {
      logger.debug({ userData: { ...data, password: "[REDACTED]" } }, "Creating new user");
      const result = await this.db.insert(users).values(data).returning();

      logger.debug({ userId: result[0].user_id }, "User created successfully");
      return result[0];
    } catch (error) {
      logger.error({ error }, "Error creating user");
      throw error;
    }
  }

  async update(id: string, data: UserUpdateInput): Promise<User | null> {
    try {
      logger.debug(
        {
          userId: id,
          updateData: {
            ...data,
          },
        },
        "Updating user",
      );
      const result = await this.db.update(users).set(data).where(eq(users.user_id, id)).returning();

      return result.length ? result[0] : null;
    } catch (error) {
      logger.error({ error, userId: id }, "Error updating user");
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      logger.debug({ userId: id }, "Deleting user");
      const result = await this.db.delete(users).where(eq(users.user_id, id)).returning();

      const success = result.length > 0;
      logger.debug({ userId: id, success }, "User deletion result");
      return success;
    } catch (error) {
      logger.error({ error, userId: id }, "Error deleting user");
      return false;
    }
  }

  async count(): Promise<number> {
    try {
      logger.debug("Counting users");
      const result = await this.db.select({ count: sql`count(*)` }).from(users);

      return Number(result[0].count);
    } catch (error) {
      logger.error({ error }, "Error counting users");
      throw error;
    }
  }
}
