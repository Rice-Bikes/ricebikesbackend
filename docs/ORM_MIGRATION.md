# Rice Bikes ORM Migration: Prisma to Drizzle

This document outlines the migration from Prisma ORM to Drizzle ORM in the Rice Bikes backend system, focusing on the environment variable control approach for repository selection.

## Overview

The Rice Bikes backend is transitioning from Prisma ORM to Drizzle ORM. To ensure a smooth migration with minimal risk, we've implemented a system that allows for:

1. Gradually rolling out Drizzle repositories
2. Controlling which repositories use Drizzle vs. Prisma via environment variables
3. Quick rollback capabilities if issues arise

## Environment Variable Control

### Global ORM Selection

The global switch for enabling Drizzle across all repositories:

```env
USE_DRIZZLE=true|false
```

By default, this is set to `false`, meaning Prisma will be used unless specified otherwise.

### Repository-Specific Control

For granular control, each repository type has its own environment variable:

```env
DRIZZLE_USER_REPO=true|false
DRIZZLE_TRANSACTION_REPO=true|false
DRIZZLE_CUSTOMER_REPO=true|false
DRIZZLE_BIKE_REPO=true|false
DRIZZLE_ITEM_REPO=true|false
DRIZZLE_REPAIR_REPO=true|false
```

These repository-specific variables take precedence over the global `USE_DRIZZLE` setting. If not specified, they default to the value of `USE_DRIZZLE`.

## Implementation Details

### Repository Factory

The repository factory pattern allows for runtime selection of the appropriate repository implementation:

```typescript
// Example from factory.ts
function shouldUseDrizzle(envVar: string): boolean {
  // First check repository-specific environment variable
  const envVarValue = process.env[envVar];
  if (envVarValue !== undefined) {
    return envVarValue.toLowerCase() === "true";
  }

  // Fall back to global flag
  return USE_DRIZZLE;
}

export async function createUserRepository(): Promise<UserRepository> {
  const useDrizzle = shouldUseDrizzle(DrizzleEnvVars.USER_REPO);

  if (useDrizzle) {
    return new UserRepositoryDrizzle(drizzleDb);
  }
  return new UserRepositoryPrisma(getPrismaClient());
}
```

### Feature Flag System

The system still maintains backward compatibility with the feature flag system, but environment variables now take precedence:

```typescript
export async function isFeatureEnabled(
  flagName: FeatureFlag | string,
  defaultValue: boolean = false,
): Promise<boolean> {
  // Check environment variable override first
  const envValue = getFeatureFlagFromEnv(flagName);
  if (envValue !== undefined) {
    return envValue;
  }
  
  // Otherwise check the database-stored flag
  // ...
}
```

## Recommended Migration Approach

1. **Testing Phase**:
   - Set all environment variables to `false`
   - Enable repositories one by one in your development/staging environment
   - Run comprehensive tests after enabling each repository

2. **Rollout Phase**:
   - Start with low-risk repositories (e.g., `DRIZZLE_USER_REPO=true`)
   - Monitor for issues before proceeding to the next repository
   - Save transactional repositories for last

3. **Final Cutover**:
   - Once all repositories have been tested individually, set `USE_DRIZZLE=true`
   - Remove individual repository flags for simplicity
   - Continue monitoring for issues

4. **Cleanup Phase** (Future):
   - Once Drizzle has been stable in production, remove the Prisma implementation
   - Simplify the codebase by removing the factory pattern

## Configuration Utility

A utility script is provided to help manage these environment variables:

```bash
# Update .env file with ORM selection variables
node scripts/update-env.js

# Interactive mode
node scripts/update-env.js --interactive
```

## Troubleshooting

### Dependency Issues

Ensure all required dependencies are installed:

```bash
npm install csv-parser # For itemRepositoryDrizzle
```

### Rollback Procedure

If issues are encountered:

1. Set the problematic repository's environment variable back to `false`
2. Restart the application
3. The system will fall back to using the Prisma implementation

## Monitoring During Migration

Monitor the following during migration:

1. Application logs for errors related to ORM operations
2. Database performance metrics
3. API response times for endpoints using the migrated repositories
4. Functionality in the UI that relies on the migrated repositories

## Complete Example Configuration

```env
# General
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ricebikes

# ORM Selection
USE_DRIZZLE=false
DRIZZLE_USER_REPO=true
DRIZZLE_CUSTOMER_REPO=true
DRIZZLE_BIKE_REPO=false
DRIZZLE_TRANSACTION_REPO=false
DRIZZLE_ITEM_REPO=false
DRIZZLE_REPAIR_REPO=false
```

In this example, only the User and Customer repositories would use Drizzle, while the rest would continue using Prisma.