/**
 * Customer Repository Factory
 *
 * This file provides factory functions to create customer repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import { CustomersRepository } from "./customerRepository";
import { CustomersRepositoryDrizzle } from "./customerRepositoryDrizzle";

// Feature flag name for customer repository
const CUSTOMER_REPO_FLAG = "drizzle_customer_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate customer repository implementation
 * based on feature flags
 */
export async function createCustomerRepository(): Promise<CustomersRepository | CustomersRepositoryDrizzle> {
  try {
    // Check specific feature flag, fall back to global flag
    // Always use Drizzle implementation now
    logger.debug("Using Drizzle Customer Repository");
    return new CustomersRepositoryDrizzle();
  } catch (error) {
    // If there's any error checking feature flags, default to Prisma
    logger.error(`Error determining customer repository implementation: ${error}`);
    return new CustomersRepository();
  }
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createCustomerRepositorySync(forceDrizzle = false): CustomersRepository | CustomersRepositoryDrizzle {
  // Always return Drizzle implementation
  return new CustomersRepositoryDrizzle();
}
