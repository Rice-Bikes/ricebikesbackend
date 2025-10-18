/**
 * TransactionDetails Repository Factory
 *
 * This file provides factory functions to create transaction details repositories.
 * It centralizes the creation of Drizzle transaction details repository instances.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type { TransactionDetails } from "./transactionDetailsModel";
import { TransactionDetailsRepositoryDrizzle } from "./transactionDetailsRepositoryDrizzle";

/**
 * Create and return a Drizzle transaction details repository implementation
 */
export async function createTransactionDetailsRepository(): Promise<TransactionDetailsRepositoryDrizzle> {
  try {
    logger.debug("Creating Drizzle TransactionDetails Repository");
    return new TransactionDetailsRepositoryDrizzle(drizzleDb);
  } catch (error) {
    logger.error(`Error creating transaction details repository: ${error}`);
    throw error;
  }
}

/**
 * Create a repository instance immediately
 * This is useful for scripts or initialization code
 */
export function createTransactionDetailsRepositorySync(): TransactionDetailsRepositoryDrizzle {
  return new TransactionDetailsRepositoryDrizzle(drizzleDb);
}
