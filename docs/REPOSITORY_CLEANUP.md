# Repository Cleanup Instructions

## Overview

This document outlines the steps to clean up the old repository structure now that the migration of repositories from the centralized structure to API-specific implementations is complete.

## Prerequisites

Before proceeding with the cleanup:

1. Ensure all tests are passing with the new repository structure
2. Verify that no code is importing from the old repository structure
3. Commit any pending changes to version control

## Cleanup Steps

### 1. Remove Old Repository Files

The following directories and files can now be safely removed:

```bash
rm -rf src/repositories/drizzle
rm -rf src/repositories/prisma
rm -f src/repositories/factory.ts
rm -f src/repositories/interfaces.ts
rm -f src/repositories/compare-repos.ts
rm -f src/repositories/index.ts
```

### 2. Update Import References in Tests

If any tests are still importing from the old repository structure, update them to use the new API-specific repositories.

### 3. Remove Repository Feature Flags

Since the migration is complete, the feature flags used to toggle between repository implementations can be simplified or removed:

- If Drizzle is now the standard implementation, set the global `USE_DRIZZLE=true` environment variable
- Alternatively, update repository factories to use Drizzle by default without checking feature flags

### 4. Update Documentation

Ensure all documentation reflects the new repository structure:

- Update README.md if it mentions the old repository structure
- Update developer onboarding documentation
- Update architectural documentation

## Verification

After completing the cleanup:

1. Run the test suite to ensure all tests pass: `npm test`
2. Start the application in development mode: `npm run dev`
3. Verify that all API endpoints function correctly

## Future Considerations

- Continue standardizing repository interfaces across API components
- Consider further refactoring to improve consistency between repository implementations
- Update code generators (if any) to create repositories in the API-specific directories

## Conclusion

After completing these cleanup steps, the codebase will be fully migrated to the new repository structure, with no remnants of the old centralized approach.