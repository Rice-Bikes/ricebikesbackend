/**
 * Customer Repository Factory
 *
 * This file provides factory functions to create customer repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import { CustomersRepositoryDrizzle } from "./customerRepositoryDrizzle";

// Feature flag name for customer repository
const CUSTOMER_REPO_FLAG = "drizzle_customer_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate customer repository implementation
 * based on feature flags
 */
export async function createCustomerRepository(): Promise<CustomersRepositoryDrizzle> {
  return new CustomersRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createCustomerRepositorySync(forceDrizzle = false): CustomersRepositoryDrizzle {
  // Always return Drizzle implementation
  return new CustomersRepositoryDrizzle();
}
