/**
 * Transaction Repository Factory
 *
 * This file provides factory functions to create transaction repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import type { TransactionRepository } from "./transactionRepository";
import { TransactionRepositoryDrizzle } from "./transactionRepositoryDrizzle";

// Feature flag name for transaction repository
const TRANSACTION_REPO_FLAG = "drizzle_transaction_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate transaction repository implementation
 * based on feature flags
 */
export async function createTransactionRepository(): Promise<TransactionRepository | TransactionRepositoryDrizzle> {
  try {
    // Always use Drizzle implementation now
    logger.debug("Using Drizzle Transaction Repository");
    return new TransactionRepositoryDrizzle();
  } catch (error) {
    // If there's any error checking feature flags, default to Drizzle
    logger.error(`Error determining repository implementation: ${error}`);
    return new TransactionRepositoryDrizzle();
  }
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createTransactionRepositorySync(
  forceDrizzle = false,
): TransactionRepository | TransactionRepositoryDrizzle {
  // Always return Drizzle implementation
  return new TransactionRepositoryDrizzle();
}
