/**
 * Bike Repository Factory
 *
 * This file provides factory functions to create bike repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import { BikesRepositoryDrizzle } from "./bikesRepositoryDrizzle";

// Feature flag name for bike repository
const BIKE_REPO_FLAG = "drizzle_bike_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate bike repository implementation
 * based on feature flags
 */
export async function createBikeRepository(): Promise<BikesRepositoryDrizzle> {
  logger.debug("Using Drizzle Bike Repository");
  return new BikesRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createBikeRepositorySync(forceDrizzle = false): BikesRepositoryDrizzle {
  return new BikesRepositoryDrizzle();
}
