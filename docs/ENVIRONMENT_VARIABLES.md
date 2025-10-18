# Rice Bikes Environment Variables

This document outlines the environment variables used in the Rice Bikes backend system.

## General Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node environment | `development` | `production` |
| `PORT` | Port for the server | `3000` | `8080` |
| `DATABASE_URL` | Database connection string | - | `postgresql://user:password@localhost:5432/ricebikes` |

## ORM Selection

The system supports both Prisma and Drizzle ORMs. The following environment variables control which ORM is used.

### Global ORM Control

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|-------------|
| `USE_DRIZZLE` | Use Drizzle ORM instead of Prisma | `false` | `true`, `false` |

### Repository-specific ORM Control

These variables allow for granular control over which repositories use Drizzle. If not set, they fall back to the global `USE_DRIZZLE` setting.

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|-------------|
| `DRIZZLE_USER_REPO` | Use Drizzle for User repository | `USE_DRIZZLE` value | `true`, `false` |
| `DRIZZLE_TRANSACTION_REPO` | Use Drizzle for Transaction repository | `USE_DRIZZLE` value | `true`, `false` |
| `DRIZZLE_CUSTOMER_REPO` | Use Drizzle for Customer repository | `USE_DRIZZLE` value | `true`, `false` |
| `DRIZZLE_BIKE_REPO` | Use Drizzle for Bike repository | `USE_DRIZZLE` value | `true`, `false` |
| `DRIZZLE_ITEM_REPO` | Use Drizzle for Item repository | `USE_DRIZZLE` value | `true`, `false` |
| `DRIZZLE_REPAIR_REPO` | Use Drizzle for Repair repository | `USE_DRIZZLE` value | `true`, `false` |

## Feature Flags

Feature flags can be controlled through environment variables. Environment variable settings always take precedence over database-stored flags.

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|-------------|
| `FEATURE_USE_DRIZZLE` | Enable Drizzle ORM | `false` | `true`, `false` |
| `FEATURE_NEW_BIKE_FORM` | Enable new bike form UI | `false` | `true`, `false` |
| `FEATURE_ENHANCED_REPAIRS` | Enable enhanced repair workflow | `false` | `true`, `false` |
| `FEATURE_INVENTORY_SYSTEM` | Enable inventory management system | `true` | `true`, `false` |

### Feature Flag Naming Convention

For any feature flag defined in the system, you can create an environment variable with the prefix `FEATURE_` followed by the flag name in uppercase. For example, for a feature flag named `my_new_feature`, the corresponding environment variable would be `FEATURE_MY_NEW_FEATURE`.

## Authentication and Security

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `JWT_SECRET` | Secret key for JWT authentication | - | `your-256-bit-secret` |
| `JWT_EXPIRATION` | JWT token expiration in seconds | `86400` (24 hours) | `3600` |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins | `*` | `https://app.ricebikes.org,https://admin.ricebikes.org` |

## Logging

| Variable | Description | Default | Valid Values |
|----------|-------------|---------|-------------|
| `LOG_LEVEL` | Logging level | `info` | `error`, `warn`, `info`, `http`, `debug`, `silly` |

## Testing

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `TEST_DATABASE_URL` | Database connection string for tests | - | `postgresql://user:password@localhost:5432/ricebikes_test` |

## Example .env File

```env
# General
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ricebikes

# ORM Selection
USE_DRIZZLE=false
DRIZZLE_USER_REPO=true
DRIZZLE_CUSTOMER_REPO=true

# Feature Flags
FEATURE_NEW_BIKE_FORM=true
FEATURE_ENHANCED_REPAIRS=false

# Authentication
JWT_SECRET=your-256-bit-secret
JWT_EXPIRATION=86400

# Logging
LOG_LEVEL=info
```

## Usage in Code

Environment variables should be accessed through the `process.env` object in Node.js:

```typescript
// Example
const useDrizzle = process.env.USE_DRIZZLE === 'true';
const port = parseInt(process.env.PORT || '3000', 10);
```

For feature flags, use the `isFeatureEnabled` function from the feature flags utility:

```typescript
import { isFeatureEnabled, FeatureFlag } from "../utils/feature-flags";

const newBikeFormEnabled = await isFeatureEnabled(FeatureFlag.NEW_BIKE_FORM);
```

This will check both the environment variable and the database-stored flag value, with the environment variable taking precedence.