/**
 * Feature Flag Manager
 *
 * This utility manages feature flags for the Rice Bikes backend.
 * It provides a centralized way to control feature rollouts.
 * Now exclusively uses Drizzle ORM for database operations.
 */

import { eq } from "drizzle-orm";
import { db as drizzleDb } from "../db/client";
import { featureFlagAudit, featureFlags } from "../db/schema/featureFlags";

// Flag names
export enum FeatureFlag {
  NEW_BIKE_FORM = "new_bike_form",
  ENHANCED_REPAIRS = "enhanced_repairs",
  INVENTORY_SYSTEM = "inventory_system",
}

// Cache of feature flags
const featureFlagCache: Map<string, boolean> = new Map();
let cacheExpiry = Date.now();
const CACHE_TTL = 60000; // 1 minute in milliseconds

/**
 * Get feature flag from environment variable
 *
 * @param flagName The name of the feature flag
 * @param defaultValue Default value if the environment variable is not set
 * @returns Boolean value of the feature flag
 */
function getFeatureFlagFromEnv(flagName: string, defaultValue = false): boolean | undefined {
  const envVarName = `FEATURE_${flagName.toUpperCase()}`;
  const envValue = process.env[envVarName];

  if (envValue !== undefined) {
    return envValue.toLowerCase() === "true";
  }

  return undefined;
}

// Type for database errors
interface DbError {
  message?: string;
  cause?: {
    message?: string;
  };
}

// Check if an error is related to missing FeatureFlags table
function isTableNotExistError(error: unknown): boolean {
  const dbError = error as DbError;
  return !!(
    dbError?.message?.includes('relation "FeatureFlags" does not exist') ||
    dbError?.cause?.message?.includes('relation "FeatureFlags" does not exist')
  );
}

/**
 * Check if a feature flag is enabled
 *
 * @param flagName The name of the feature flag
 * @param defaultValue Default value if the flag is not found
 * @returns Whether the flag is enabled
 */
export async function isFeatureEnabled(flagName: FeatureFlag | string, defaultValue = false): Promise<boolean> {
  // Check environment variable override first (this always takes priority)
  const envValue = getFeatureFlagFromEnv(flagName);
  if (envValue !== undefined) {
    return envValue;
  }

  // Check the cache if it's still valid
  if (cacheExpiry > Date.now() && featureFlagCache.has(flagName)) {
    return featureFlagCache.get(flagName) || defaultValue;
  }

  try {
    // Try to query the database for the flag
    try {
      const result = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.flag_name, flagName));

      const flag = result.length > 0 ? result[0] : null;

      // Update the cache
      featureFlagCache.set(flagName, flag?.value ?? defaultValue);
      cacheExpiry = Date.now() + CACHE_TTL;

      return flag?.value ?? defaultValue;
    } catch (dbError) {
      // If table doesn't exist, log it once and use default value
      if (isTableNotExistError(dbError)) {
        console.warn(`FeatureFlags table doesn't exist yet. Using default value for ${flagName}: ${defaultValue}`);
        return defaultValue;
      }
      throw dbError; // Re-throw if it's a different error
    }
  } catch (error) {
    console.error(`Error retrieving feature flag ${flagName}:`, error);
    return defaultValue;
  }
}

/**
 * Update a feature flag
 *
 * @param flagName The name of the feature flag
 * @param value The new value for the flag
 * @param updatedBy User who is updating the flag
 * @param reason Optional reason for the change
 * @returns Whether the update was successful
 */
export async function updateFeatureFlag(
  flagName: FeatureFlag | string,
  value: boolean,
  updatedBy: string,
  reason?: string,
): Promise<boolean> {
  try {
    try {
      // Check if flag exists
      const existingFlag = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.flag_name, flagName));

      const oldValue = existingFlag.length > 0 ? existingFlag[0].value : undefined;

      if (existingFlag.length > 0) {
        // Update existing flag
        await drizzleDb
          .update(featureFlags)
          .set({
            value,
            updated_by: updatedBy,
            updated_at: new Date(),
          })
          .where(eq(featureFlags.flag_name, flagName));
      } else {
        // Create new flag
        await drizzleDb.insert(featureFlags).values({
          flag_name: flagName,
          value,
          description: `Auto-created flag for ${flagName}`,
          status: "active",
          updated_by: updatedBy,
          updated_at: new Date(),
          created_at: new Date(),
        });
      }

      // Record the change in the audit table
      await drizzleDb.insert(featureFlagAudit).values({
        flag_name: flagName,
        old_value: oldValue,
        new_value: value,
        changed_by: updatedBy,
        reason: reason || "No reason provided",
        changed_at: new Date(),
        // ID is auto-incremented, but we need to provide it for TypeScript
        id: 0,
        details: null,
      });

      // Invalidate the cache
      featureFlagCache.delete(flagName);

      return true;
    } catch (dbError) {
      // If table doesn't exist, log a warning
      if (isTableNotExistError(dbError)) {
        console.warn(`Cannot update feature flag ${flagName}: FeatureFlags table doesn't exist yet.`);
        // Set in memory cache anyway
        featureFlagCache.set(flagName, value);
        cacheExpiry = Date.now() + CACHE_TTL;
        return true;
      }
      throw dbError; // Re-throw if it's a different error
    }
  } catch (error) {
    console.error(`Error updating feature flag ${flagName}:`, error);
    return false;
  }
}

/**
 * Initialize default feature flags in the database
 *
 * @param systemUser User name to use for initialization
 */
export async function initializeFeatureFlags(systemUser = "system"): Promise<void> {
  const defaultFlags = [
    {
      name: FeatureFlag.NEW_BIKE_FORM,
      value: false,
      description: "Use the new bike form UI",
    },
    {
      name: FeatureFlag.ENHANCED_REPAIRS,
      value: false,
      description: "Enable enhanced repair workflow",
    },
    {
      name: FeatureFlag.INVENTORY_SYSTEM,
      value: true,
      description: "Use the inventory management system",
    },
  ];

  try {
    for (const flag of defaultFlags) {
      try {
        const existing = await drizzleDb.select().from(featureFlags).where(eq(featureFlags.flag_name, flag.name));

        if (existing.length === 0) {
          await drizzleDb.insert(featureFlags).values({
            flag_name: flag.name,
            value: flag.value,
            description: flag.description,
            status: "active",
            updated_by: systemUser,
            updated_at: new Date(),
            created_at: new Date(),
          });

          console.log(`Created feature flag: ${flag.name}`);
        }
      } catch (dbError) {
        // If table doesn't exist, log it and continue
        if (isTableNotExistError(dbError)) {
          console.warn(`Cannot initialize feature flags: FeatureFlags table doesn't exist yet.`);
          return; // Exit the function early
        }
        throw dbError; // Re-throw if it's a different error
      }
    }
  } catch (error) {
    console.error("Error initializing feature flags:", error);
  }
}

/**
 * Clear the feature flag cache
 */
export function clearFeatureFlagCache(): void {
  featureFlagCache.clear();
  cacheExpiry = 0;
}
