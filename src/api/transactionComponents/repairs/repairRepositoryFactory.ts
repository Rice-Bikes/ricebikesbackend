/**
 * Repair Repository Factory
 *
 * This file provides factory functions to create repair repositories.
 * It centralizes the creation of Drizzle repair repository instances.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import { RepairRepositoryDrizzle } from "./repairRepositoryDrizzle";
import type { RepairRepository } from "./types";

/**
 * Create and return a Drizzle repair repository implementation
 */
export async function createRepairRepository(): Promise<RepairRepository> {
  try {
    logger.debug("Using Drizzle Repair Repository");
    return new RepairRepositoryDrizzle(drizzleDb);
  } catch (error) {
    logger.error(`Error creating repository implementation: ${error}`);
    throw error;
  }
}

/**
 * Create a repository instance immediately
 * This is useful for scripts or initialization code
 */
export function createRepairRepositorySync(): RepairRepositoryDrizzle {
  return new RepairRepositoryDrizzle(drizzleDb);
}
