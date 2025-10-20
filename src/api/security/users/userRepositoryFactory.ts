/**
 * User Repository Factory
 *
 * This file provides factory functions to create user repositories.
 * It centralizes the decision between using Prisma or Drizzle implementations
 * based on feature flags.
 */

import { serviceLogger as logger } from "@/common/utils/logger";
import { isFeatureEnabled } from "@/utils/feature-flags";
import { UsersRepositoryDrizzle } from "./userRepositoryDrizzle";

// Feature flag name for user repository
const USER_REPO_FLAG = "drizzle_user_repo";

// Global flag fallback
const USE_DRIZZLE = process.env.USE_DRIZZLE === "true";

/**
 * Create and return the appropriate user repository implementation
 * based on feature flags
 */
export async function createUserRepository(): Promise<UsersRepositoryDrizzle> {
  // Check specific feature flag, fall back to global flag
  const useDrizzle = await isFeatureEnabled(USER_REPO_FLAG, USE_DRIZZLE);

  logger.debug("Using Drizzle User Repository");
  return new UsersRepositoryDrizzle();
}

/**
 * Create a repository instance immediately without checking feature flags
 * This is useful for scripts or initialization code that needs to run
 * before the feature flag system is ready
 */
export function createUserRepositorySync(forceDrizzle = false): UsersRepositoryDrizzle {
  return new UsersRepositoryDrizzle();
}
