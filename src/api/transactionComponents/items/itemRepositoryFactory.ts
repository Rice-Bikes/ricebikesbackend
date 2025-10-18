/**
 * Item Repository Factory
 *
 * This file provides factory functions to create item repositories.
 * It centralizes the creation of Drizzle item repository instances.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import { Item } from "./itemModel";
import { ItemRepositoryDrizzle } from "./itemRepositoryDrizzle";

/**
 * Create and return a Drizzle item repository implementation
 */
export async function createItemRepository(): Promise<ItemRepositoryDrizzle> {
  try {
    logger.debug("Creating Drizzle Item Repository");
    return new ItemRepositoryDrizzle(drizzleDb);
  } catch (error) {
    logger.error(`Error creating item repository: ${error}`);
    throw error;
  }
}

/**
 * Create a repository instance immediately
 * This is useful for scripts or initialization code
 */
export function createItemRepositorySync(): ItemRepositoryDrizzle {
  return new ItemRepositoryDrizzle(drizzleDb);
}
