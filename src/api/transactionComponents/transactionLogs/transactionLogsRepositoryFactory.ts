/**
 * TransactionLogs Repository Factory
 *
 * This file provides factory functions to create transaction logs repositories.
 * It centralizes the creation of Drizzle transaction logs repository instances.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type { TransactionLog } from "./transactionLogsModel";
import { TransactionLogsRepositoryDrizzle } from "./transactionLogsRepositoryDrizzle";

/**
 * Create and return a Drizzle transaction logs repository implementation
 */
export async function createTransactionLogsRepository(): Promise<TransactionLogsRepositoryDrizzle> {
  try {
    logger.debug("Creating Drizzle TransactionLogs Repository");
    return new TransactionLogsRepositoryDrizzle(drizzleDb);
  } catch (error) {
    logger.error(`Error creating transaction logs repository: ${error}`);
    throw error;
  }
}

/**
 * Create a repository instance immediately
 * This is useful for scripts or initialization code
 */
export function createTransactionLogsRepositorySync(): TransactionLogsRepositoryDrizzle {
  return new TransactionLogsRepositoryDrizzle(drizzleDb);
}
