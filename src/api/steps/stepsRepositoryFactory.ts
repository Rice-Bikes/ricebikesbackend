/**
 * Step Repository Factory
 *
 * This file provides factory functions to create step repositories.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { StepsRepositoryDrizzle } from "./stepsRepositoryDrizzle";

/**
 * Create and return the step repository implementation
 */
export async function createStepRepository(): Promise<StepsRepositoryDrizzle> {
  logger.debug("Using Drizzle Step Repository");
  return new StepsRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createStepRepositorySync(): StepsRepositoryDrizzle {
  return new StepsRepositoryDrizzle();
}
