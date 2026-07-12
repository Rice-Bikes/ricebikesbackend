/**
 * Tune Up Item Repository Factory
 *
 * This file provides factory functions to create tune up item repositories.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { TuneUpItemRepositoryDrizzle } from "./tuneUpItemRepositoryDrizzle";

/**
 * Create and return the tune up item repository implementation
 */
export async function createTuneUpItemRepository(): Promise<TuneUpItemRepositoryDrizzle> {
  logger.debug("Using Drizzle Tune Up Item Repository");
  return new TuneUpItemRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createTuneUpItemRepositorySync(): TuneUpItemRepositoryDrizzle {
  return new TuneUpItemRepositoryDrizzle();
}
