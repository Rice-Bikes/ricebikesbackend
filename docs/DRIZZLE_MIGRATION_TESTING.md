# Drizzle Migration Testing Guide

This document provides guidance on testing the completed migration from Prisma ORM to Drizzle ORM in the Rice Bikes backend application.

## Overview

The codebase has been updated to exclusively use Drizzle ORM for all database operations. Previously, we had a dual implementation approach with feature flags to selectively enable Drizzle for specific repositories. Now, all repositories use Drizzle only.

## Key Changes

1. **Repository Factory**: The repository factory now returns only Drizzle implementations.
2. **Feature Flags**: Removed Prisma dependencies from the feature flags system.
3. **Repository Pattern**: Simplified the repository pattern to use Drizzle only.
4. **Import Structure**: Updated imports throughout the codebase to use the new structure.

## Testing Strategy

### 1. Basic Functionality Testing

Test all basic CRUD operations for each repository:

```bash
# Run the entire test suite
npm test

# Run specific repository tests
npm test -- -t "RepairRepository"
npm test -- -t "ItemRepository"
```

### 2. API Endpoint Testing

Test all API endpoints to ensure they're working with the Drizzle repositories:

```bash
# Start the server in test mode
npm run dev:test

# Use Postman, curl, or your preferred API testing tool to test endpoints
curl http://localhost:3000/health-check
```

### 3. Integration Testing

Test workflows that span multiple repositories:

- Create a customer → Create a transaction for that customer → Add repairs
- Add items to inventory → Create transactions with those items
- User authentication and authorization

### 4. Performance Testing

Compare performance before and after the migration:

```bash
# Install autocannon if not already installed
npm install -g autocannon

# Test endpoints
autocannon -c 100 -d 5 -p 10 http://localhost:3000/items
```

### 5. Common Issues to Watch For

1. **Type Mismatches**: Look for any type errors related to repository interfaces
2. **Missing Methods**: Ensure all required repository methods are implemented
3. **Transaction Handling**: Verify that transactions work correctly across repositories
4. **Error Handling**: Check that error handling is consistent
5. **Decimal Handling**: Verify that decimal values (prices, taxes) are handled correctly

## Verifying Success

The migration is successful when:

1. All tests pass
2. API endpoints function correctly
3. No errors appear in the logs related to missing repositories or methods
4. The application performs at least as well as before

## Rollback Plan

If issues are found:

1. Record the specific issue in detail
2. Try to fix the issue in the Drizzle implementation
3. If the issue cannot be resolved quickly, consider:
   - Reverting to the previous commit
   - Restoring the feature flag system to use Prisma for problematic repositories

## Reporting Issues

If you encounter issues during testing, please include:

1. The specific repository and method that failed
2. The exact error message
3. Steps to reproduce the issue
4. Any relevant data (sanitized of sensitive information)

Report issues using the project's issue tracker.

## Final Verification Checklist

- [ ] All tests are passing
- [ ] Application starts without errors
- [ ] All CRUD operations work for all entity types
- [ ] Transaction workflows work correctly
- [ ] Authentication and authorization work
- [ ] Reports and exports generate correctly
- [ ] No Prisma-related errors in logs

Once all these checks have passed, the migration can be considered complete.