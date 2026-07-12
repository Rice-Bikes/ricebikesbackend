/**
 * Step Bundle Repository Factory
 *
 * This file provides factory functions to create step bundle repositories.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { StepBundleRepositoryDrizzle } from "./stepBundleRepositoryDrizzle";

/**
 * Create and return the step bundle repository implementation
 */
export async function createStepBundleRepository(): Promise<StepBundleRepositoryDrizzle> {
  logger.debug("Using Drizzle Step Bundle Repository");
  return new StepBundleRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createStepBundleRepositorySync(): StepBundleRepositoryDrizzle {
  return new StepBundleRepositoryDrizzle();
}
