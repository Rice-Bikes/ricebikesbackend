/**
 * Tune Up Repository Factory
 *
 * This file provides factory functions to create tune up repositories.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { TuneUpRepositoryDrizzle } from "./tuneUpRepositoryDrizzle";

/**
 * Create and return the tune up repository implementation
 */
export async function createTuneUpRepository(): Promise<TuneUpRepositoryDrizzle> {
  logger.debug("Using Drizzle Tune Up Repository");
  return new TuneUpRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createTuneUpRepositorySync(): TuneUpRepositoryDrizzle {
  return new TuneUpRepositoryDrizzle();
}
