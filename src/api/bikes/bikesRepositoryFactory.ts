/**
 * Bike Repository Factory
 *
 * This file provides factory functions to create bike repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import { BikesRepository } from "./bikesRepository";
import { BikesRepositoryDrizzle } from "./bikesRepositoryDrizzle";

// Feature flag name for bike repository
const BIKE_REPO_FLAG = "drizzle_bike_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate bike repository implementation
 * based on feature flags
 */
export async function createBikeRepository(): Promise<BikesRepository | BikesRepositoryDrizzle> {
  try {
    // Check specific feature flag, fall back to global flag
    const useDrizzle = await isFeatureEnabled(BIKE_REPO_FLAG, USE_DRIZZLE);

    if (useDrizzle) {
      logger.debug("Using Drizzle Bike Repository");
      return new BikesRepositoryDrizzle();
    } else {
      logger.debug("Using Prisma Bike Repository");
      return new BikesRepository();
    }
  } catch (error) {
    // If there's any error checking feature flags, default to Prisma
    logger.error(`Error determining repository implementation: ${error}`);
    return new BikesRepository();
  }
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createBikeRepositorySync(forceDrizzle = false): BikesRepository | BikesRepositoryDrizzle {
  return forceDrizzle ? new BikesRepositoryDrizzle() : new BikesRepository();
}
