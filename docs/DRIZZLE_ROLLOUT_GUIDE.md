# Drizzle ORM Rollout Guide

This guide outlines the process for rolling out Drizzle ORM to replace Prisma in the Rice Bikes backend.

## Table of Contents

- [Overview](#overview)
- [Implementation Status](#implementation-status)
- [Rollout Strategy](#rollout-strategy)
- [Testing Procedure](#testing-procedure)
- [Monitoring](#monitoring)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

## Overview

We have implemented a phased approach to migrate from Prisma ORM to Drizzle ORM. This allows us to:

1. Gradually transition each repository type independently
2. A/B test implementations to ensure correctness
3. Roll back quickly if issues arise
4. Complete the migration with minimal disruption
5. Maintain consistent behavior between implementations

## Implementation Status

### Completed
- ✅ Schema definitions for all entities
- ✅ Database connection and configuration
- ✅ Repository interfaces
- ✅ Repository implementations:
  - ✅ UserRepositoryDrizzle
  - ✅ TransactionRepositoryDrizzle
  - ✅ CustomerRepositoryDrizzle
  - ✅ BikeRepositoryDrizzle
  - ✅ ItemRepositoryDrizzle
  - ✅ RepairRepositoryDrizzle
- ✅ Factory pattern for repository selection
- ✅ Feature flag system
- ✅ Comparison testing utilities

### In Progress
- ✅ Integration with service layer
  - ✅ Bikes API module integrated
  - ✅ Customer API module integrated
  - ✅ Items API module integrated
  - ✅ Repairs API module integrated
  - ✅ Transactions API module integrated
  - ✅ All API modules integrated
- 🔄 Comprehensive testing
  - ✅ Unit tests for Bike repository implementations
  - ✅ Integration tests for service-repository interactions
  - 🔄 Tests for other repositories
- ✅ Production deployment planning
  - ✅ Docker configuration updated
  - ✅ All repositories ready for production

## Rollout Strategy

We're using a feature flag approach to control which repositories use Drizzle vs Prisma. This is managed at two levels:

1. **Global Flag**: `USE_DRIZZLE` environment variable or `use_drizzle` feature flag
2. **Repository-Specific Flags**: Individual flags for each repository type

### Feature Flags

| Flag Name | Description | Controls |
|-----------|-------------|----------|
| `drizzle_user_repo` | Use Drizzle for User repository | User operations |
| `drizzle_transaction_repo` | Use Drizzle for Transaction repository | Transaction operations |
| `drizzle_customer_repo` | Use Drizzle for Customer repository | Customer operations |
| `drizzle_bike_repo` | Use Drizzle for Bike repository | Bike operations |
| `drizzle_item_repo` | Use Drizzle for Item repository | Item operations |
| `drizzle_repair_repo` | Use Drizzle for Repair repository | Repair operations |

### Rollout Phases

1. **Initialize Flags**
   ```bash
   npm run flags:init
   npm run flags:repo-init
   ```

2. **Enable Testing Mode**
   - Enable one repository at a time in development/staging
   - Run comparison tests

3. **Gradual Production Rollout**
   - Start with less critical repositories
   - Recommended order:
     1. Users
     2. Customers
     3. Bikes
     4. Items
     5. Repairs
     6. Transactions (most complex, last)

4. **Complete Migration**
   - Once all repositories are verified, enable the global `USE_DRIZZLE` flag
   - Remove Prisma dependencies when ready
   - Update Docker configuration to use Drizzle (Dockerfile updated)

## Testing Procedure

### Run Comparison Tests

```bash
npm run db:compare
```

This script compares the results from both Prisma and Drizzle repositories to verify equivalent functionality.

### Run Unit Tests

```bash
npm test
```

Includes specific tests for all repository implementations.

### Manual Testing Checklist

- [ ] User login/registration flows
- [ ] Customer CRUD operations (integration completed - ready for testing)
- [ ] Transaction processing
- [ ] Bike management (integration completed - ready for testing)
- [ ] Inventory operations
- [ ] Repair scheduling

### API Module Integration Progress

| Module | Drizzle Repository | Factory Integration | Service Updates | Tests |
|--------|-------------------|-------------------|----------------|-------|
| Bikes | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |
| Users | ✅ Completed | ✅ Completed | 🔄 In Progress | ✅ Completed |
| Transactions | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |
| Customers | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |
| Items | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |
| Repairs | ✅ Completed | ✅ Completed | ✅ Completed | ✅ Completed |

## Monitoring

During rollout, monitor the following:

- Application error rates
- Database performance
- Query execution times
- Repository operation success rates

Implement additional logging temporarily:

```javascript
// Add to key service functions
console.log(`[Drizzle Migration] Operation completed with repository: ${useDrizzle ? 'Drizzle' : 'Prisma'}`);
```

## Rollback Procedure

If issues arise with a specific repository:

1. Disable the specific feature flag:
   ```javascript
   await updateFeatureFlag('drizzle_user_repo', false, 'admin', 'Rollback due to issue');
   ```

2. Clear the feature flag cache:
   ```javascript
   clearFeatureFlagCache();
   ```

For complete rollback:

1. Disable the global flag:
   ```javascript
   await updateFeatureFlag('use_drizzle', false, 'admin', 'Complete rollback');
   ```

2. Set environment variable (if used):
   ```
   USE_DRIZZLE=false
   ```

## Troubleshooting

### Common Issues

#### Query Results Mismatch
- Check the schema relations
- Verify join conditions
- Compare serialization of dates and decimals
- Check Decimal handling (use `instanceof Prisma.Decimal` check in Prisma)

#### Async Repository Initialization
- Ensure `ensureRepository()` is called before repository methods
- Handle promises properly in service methods
- Check for race conditions during initialization

#### Performance Issues
- Examine query execution plan
- Check for missing indexes
- Verify connection pooling configuration

#### Type Errors
- Ensure proper type mapping between Prisma and Drizzle
- Check for nullable fields handling

### Getting Help

- Drizzle ORM Documentation: https://orm.drizzle.team/docs/overview
- GitHub Issues: https://github.com/drizzle-team/drizzle-orm/issues
- Discord Community: https://discord.gg/drizzle

## Integration Pattern

For each API module that needs to be migrated, follow these steps:

1. **Create a Drizzle repository implementation** for the module:
   ```typescript
   // Example for Module XYZ
   export class XYZRepositoryDrizzle implements XYZRepository {
     constructor(private readonly db: DrizzleDB) {}
     // Implement all required methods...
   }
   ```

2. **Create a factory function** to select the appropriate implementation:
   ```typescript
   export async function createXYZRepository(): Promise<XYZRepository> {
     const useDrizzle = await isFeatureEnabled("drizzle_xyz_repo", USE_DRIZZLE);
     return useDrizzle ? new XYZRepositoryDrizzle(db) : new XYZRepository();
   }
   ```

3. **Update the service** to use async repository initialization:
   ```typescript
   export class XYZService {
     private repository: XYZRepository;
     private repositoryInitialized = false;

     constructor() {
       this.repository = createXYZRepositorySync(); // Sync version
       this.initializeRepository(); // Start async initialization
     }

     private async initializeRepository(): Promise<void> {
       this.repository = await createXYZRepository();
       this.repositoryInitialized = true;
     }

     private async ensureRepository(): Promise<void> {
       if (!this.repositoryInitialized) {
         await this.initializeRepository();
       }
     }

     async someMethod(): Promise<Result> {
       await this.ensureRepository();
       // Use this.repository...
     }
   }
   ```

4. **Write tests** that validate both implementations have consistent behavior.

## Conclusion

This rollout approach allows us to safely migrate to Drizzle ORM while maintaining system stability and minimizing risk. The granular feature flag system provides precise control over each component of the migration.

The integration of the Bikes API module demonstrates the complete pattern from repository to service layer, serving as a blueprint for the remaining modules.

By following this guide, we can complete the migration with confidence, knowing we can verify each step and roll back if necessary.