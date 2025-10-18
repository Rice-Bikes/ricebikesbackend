# Prisma to Drizzle ORM Migration Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Schema Migration](#schema-migration)
5. [Database Connection Setup](#database-connection-setup)
6. [Query Migration Patterns](#query-migration-patterns)
7. [Step-by-Step Migration Plan](#step-by-step-migration-plan)
8. [Testing Strategy](#testing-strategy)
9. [Rollback Plan](#rollback-plan)

## Overview

This guide covers the migration from Prisma ORM to Drizzle ORM for the Rice Bikes Backend application. Drizzle offers:
- Better TypeScript performance
- More SQL-like queries
- Lighter bundle size
- Better control over generated SQL
- Migration capabilities similar to Prisma

**Current State:** PostgreSQL database with 17 models managed by Prisma
**Target State:** Same PostgreSQL database managed by Drizzle ORM

## Prerequisites

- Node.js 18+
- PostgreSQL database (existing)
- Current Prisma schema backup
- Database backup before migration

## Installation

```bash
# Install Drizzle ORM and PostgreSQL driver
npm install drizzle-orm postgres

# Install Drizzle Kit for migrations
npm install -D drizzle-kit

# Optional: Keep Prisma temporarily for parallel testing
# npm install @prisma/client prisma
```

## Schema Migration

### 1. Create Drizzle Schema Structure

Create `src/db/schema/` directory structure:

```
src/db/
├── schema/
│   ├── users.ts
│   ├── roles.ts
│   ├── transactions.ts
│   ├── bikes.ts
│   ├── items.ts
│   ├── repairs.ts
│   ├── customers.ts
│   ├── orders.ts
│   ├── featureFlags.ts
│   ├── workflowSteps.ts
│   └── index.ts
├── client.ts
└── migrate.ts
```

### 2. Schema Definitions

#### `src/db/schema/users.ts`
```typescript
import { pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('Users', {
  user_id: uuid('user_id').primaryKey().defaultRandom(),
  firstname: varchar('firstname').notNull(),
  lastname: varchar('lastname').notNull(),
  active: boolean('active').notNull(),
  username: varchar('username').notNull().unique(),
});
```

#### `src/db/schema/roles.ts`
```typescript
import { pgTable, uuid, varchar, boolean, text } from 'drizzle-orm/pg-core';

export const roles = pgTable('Roles', {
  role_id: uuid('role_id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  disabled: boolean('disabled').notNull(),
  description: text('description'),
});

export const permissions = pgTable('Permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull().unique(),
  description: varchar('description').notNull(),
});

export const userRoles = pgTable('UserRoles', {
  user_id: uuid('user_id').notNull().references(() => users.user_id, { onDelete: 'cascade' }),
  role_id: uuid('role_id').notNull().references(() => roles.role_id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.role_id] }),
}));

export const rolePermissions = pgTable('RolePermissions', {
  role_id: uuid('role_id').notNull().references(() => roles.role_id, { onDelete: 'cascade' }),
  permission_id: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.role_id, table.permission_id] }),
}));
```

#### `src/db/schema/customers.ts`
```typescript
import { pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const customers = pgTable('Customers', {
  customer_id: uuid('customer_id').primaryKey().defaultRandom(),
  first_name: varchar('first_name').notNull(),
  last_name: varchar('last_name').notNull(),
  email: varchar('email').notNull(),
  phone: varchar('phone', { length: 10 }),
});
```

#### `src/db/schema/bikes.ts`
```typescript
import { pgTable, uuid, varchar, timestamp, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const bikes = pgTable('Bikes', {
  bike_id: uuid('bike_id').primaryKey().defaultRandom(),
  make: varchar('make').notNull(),
  model: varchar('model').notNull(),
  date_created: timestamp('date_created').notNull(),
  description: varchar('description'),
  bike_type: varchar('bike_type', { length: 50 }),
  size_cm: decimal('size_cm', { precision: 5, scale: 2 }),
  condition: varchar('condition', { length: 20 }).default('Used'),
  price: decimal('price', { precision: 10, scale: 2 }),
  is_available: boolean('is_available').default(true).notNull(),
  weight_kg: decimal('weight_kg', { precision: 5, scale: 2 }),
  reservation_customer_id: uuid('reservation_customer_id').references(() => customers.customer_id),
  deposit_amount: decimal('deposit_amount', { precision: 10, scale: 2 }),
}, (table) => ({
  bikeTypeIdx: index('bikes_bike_type_idx').on(table.bike_type),
  sizeCmIdx: index('bikes_size_cm_idx').on(table.size_cm),
  conditionIdx: index('bikes_condition_idx').on(table.condition),
  isAvailableIdx: index('bikes_is_available_idx').on(table.is_available),
  reservationCustomerIdx: index('bikes_reservation_customer_id_idx').on(table.reservation_customer_id),
}));
```

#### `src/db/schema/items.ts`
```typescript
import { pgTable, uuid, varchar, integer, real, boolean, json } from 'drizzle-orm/pg-core';

export const items = pgTable('Items', {
  item_id: uuid('item_id').primaryKey().defaultRandom(),
  upc: varchar('upc').notNull().unique(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  brand: varchar('brand'),
  stock: integer('stock').notNull(),
  minimum_stock: integer('minimum_stock'),
  standard_price: real('standard_price').notNull(),
  wholesale_cost: real('wholesale_cost').notNull(),
  condition: varchar('condition'),
  disabled: boolean('disabled').notNull(),
  managed: boolean('managed'),
  category_1: varchar('category_1'),
  category_2: varchar('category_2'),
  category_3: varchar('category_3'),
  specifications: json('specifications'),
  features: json('features'),
});
```

#### `src/db/schema/repairs.ts`
```typescript
import { pgTable, uuid, varchar, integer, boolean } from 'drizzle-orm/pg-core';

export const repairs = pgTable('Repairs', {
  repair_id: uuid('repair_id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  price: integer('price').notNull(),
  disabled: boolean('disabled').notNull(),
  description: varchar('description'),
});
```

#### `src/db/schema/transactions.ts`
```typescript
import { pgTable, uuid, varchar, timestamp, serial, real, boolean, index } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { bikes } from './bikes';
import { users } from './users';
import { items } from './items';
import { repairs } from './repairs';

export const transactions = pgTable('Transactions', {
  transaction_num: serial('transaction_num').primaryKey().unique(),
  transaction_id: uuid('transaction_id').unique().defaultRandom().notNull(),
  date_created: timestamp('date_created').notNull(),
  transaction_type: varchar('transaction_type').notNull(),
  customer_id: uuid('customer_id').notNull().references(() => customers.customer_id),
  bike_id: uuid('bike_id').references(() => bikes.bike_id),
  total_cost: real('total_cost').notNull(),
  description: varchar('description'),
  is_completed: boolean('is_completed').notNull(),
  is_paid: boolean('is_paid').notNull(),
  is_refurb: boolean('is_refurb').notNull(),
  is_urgent: boolean('is_urgent').notNull(),
  is_nuclear: boolean('is_nuclear'),
  is_beer_bike: boolean('is_beer_bike').notNull(),
  is_employee: boolean('is_employee').notNull(),
  is_reserved: boolean('is_reserved').notNull(),
  is_waiting_on_email: boolean('is_waiting_on_email').notNull(),
  date_completed: timestamp('date_completed'),
});

export const transactionLogs = pgTable('TransactionLogs', {
  log_id: uuid('log_id').primaryKey().defaultRandom(),
  date_modified: timestamp('date_modified').notNull(),
  transaction_num: integer('transaction_num').notNull().references(() => transactions.transaction_num),
  changed_by: uuid('changed_by').notNull().references(() => users.user_id),
  change_type: varchar('change_type').notNull(),
  description: varchar('description').notNull(),
});

export const transactionDetails = pgTable('TransactionDetails', {
  transaction_detail_id: uuid('transaction_detail_id').primaryKey().defaultRandom(),
  transaction_id: uuid('transaction_id').defaultRandom().notNull().references(() => transactions.transaction_id),
  item_id: uuid('item_id').references(() => items.item_id),
  repair_id: uuid('repair_id').references(() => repairs.repair_id),
  changed_by: uuid('changed_by'),
  completed: boolean('completed').notNull(),
  quantity: integer('quantity').notNull(),
  date_modified: timestamp('date_modified').notNull(),
});

export const orderRequests = pgTable('OrderRequests', {
  order_request_id: uuid('order_request_id').primaryKey().defaultRandom(),
  created_by: uuid('created_by').notNull().references(() => users.user_id),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.transaction_id),
  item_id: uuid('item_id').notNull().references(() => items.item_id),
  date_created: timestamp('date_created').notNull(),
  quantity: integer('quantity').notNull(),
  notes: varchar('notes'),
  ordered: boolean('ordered').notNull(),
});
```

#### `src/db/schema/orders.ts`
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const orders = pgTable('order', {
  order_id: uuid('order_id').primaryKey().defaultRandom(),
  order_date: timestamp('order_date').defaultNow().notNull(),
  estimated_delivery: timestamp('estimated_delivery').notNull(),
  supplier: varchar('supplier').notNull(),
  ordered_by: varchar('ordered_by').notNull(),
});
```

#### `src/db/schema/featureFlags.ts`
```typescript
import { pgTable, varchar, boolean, timestamp, integer, json } from 'drizzle-orm/pg-core';

export const featureFlags = pgTable('FeatureFlags', {
  flag_name: varchar('flag_name').primaryKey(),
  value: boolean('value').notNull(),
  description: varchar('description'),
  status: varchar('status', { length: 32 }).default('active'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow().notNull(),
  updated_by: varchar('updated_by').notNull(),
});

export const featureFlagAudit = pgTable('FeatureFlagAudit', {
  id: serial('id').primaryKey(),
  flag_name: varchar('flag_name').notNull(),
  old_value: boolean('old_value'),
  new_value: boolean('new_value'),
  changed_by: varchar('changed_by').notNull(),
  changed_at: timestamp('changed_at', { precision: 6 }).defaultNow().notNull(),
  reason: varchar('reason'),
  details: json('details'),
});
```

#### `src/db/schema/workflowSteps.ts`
```typescript
import { pgTable, uuid, varchar, integer, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { transactions } from './transactions';
import { users } from './users';

export const workflowSteps = pgTable('WorkflowSteps', {
  step_id: uuid('step_id').primaryKey().defaultRandom(),
  transaction_id: uuid('transaction_id').notNull().references(() => transactions.transaction_id, { onDelete: 'cascade' }),
  workflow_type: varchar('workflow_type', { length: 50 }).notNull(),
  step_name: varchar('step_name', { length: 100 }).notNull(),
  step_order: integer('step_order').notNull(),
  is_completed: boolean('is_completed').default(false).notNull(),
  created_by: uuid('created_by').notNull().references(() => users.user_id),
  completed_by: uuid('completed_by').references(() => users.user_id),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow().notNull(),
  completed_at: timestamp('completed_at', { precision: 6 }),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow().notNull(),
}, (table) => ({
  transactionIdx: index('workflow_steps_transaction_id_idx').on(table.transaction_id),
  workflowTypeIdx: index('workflow_steps_workflow_type_idx').on(table.workflow_type),
  transactionWorkflowIdx: index('workflow_steps_transaction_workflow_idx').on(table.transaction_id, table.workflow_type),
  uniqueTransactionWorkflowOrder: unique('workflow_steps_transaction_workflow_order_unique').on(
    table.transaction_id,
    table.workflow_type,
    table.step_order
  ),
}));
```

#### `src/db/schema/index.ts`
```typescript
// Export all schemas
export * from './users';
export * from './roles';
export * from './customers';
export * from './bikes';
export * from './items';
export * from './repairs';
export * from './transactions';
export * from './orders';
export * from './featureFlags';
export * from './workflowSteps';
```

### 3. Database Connection Setup

#### `src/db/client.ts`
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// For migrations
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema });
```

### 4. Drizzle Config

#### `drizzle.config.ts` (root directory)
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

## Query Migration Patterns

### Prisma → Drizzle Query Equivalents

#### Simple Queries

**Prisma:**
```typescript
// Find all
const users = await prisma.users.findMany();

// Find by ID
const user = await prisma.users.findUnique({
  where: { user_id: id }
});

// Find first
const user = await prisma.users.findFirst({
  where: { username: 'john' }
});
```

**Drizzle:**
```typescript
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Find all
const allUsers = await db.select().from(users);

// Find by ID
const user = await db.select().from(users).where(eq(users.user_id, id)).limit(1);

// Find first
const user = await db.select().from(users).where(eq(users.username, 'john')).limit(1);
```

#### Includes/Joins

**Prisma:**
```typescript
const transaction = await prisma.transactions.findUnique({
  where: { transaction_id: id },
  include: {
    Customer: true,
    Bike: true,
    TransactionDetails: {
      include: {
        Repair: true,
        Item: true,
      }
    }
  }
});
```

**Drizzle:**
```typescript
import { transactions, customers, bikes, transactionDetails, repairs, items } from '@/db/schema';
import { eq } from 'drizzle-orm';

const transaction = await db.query.transactions.findFirst({
  where: eq(transactions.transaction_id, id),
  with: {
    customer: true,
    bike: true,
    transactionDetails: {
      with: {
        repair: true,
        item: true,
      }
    }
  }
});

// Or using joins for more control:
const result = await db
  .select()
  .from(transactions)
  .leftJoin(customers, eq(transactions.customer_id, customers.customer_id))
  .leftJoin(bikes, eq(transactions.bike_id, bikes.bike_id))
  .where(eq(transactions.transaction_id, id));
```

#### Create

**Prisma:**
```typescript
const user = await prisma.users.create({
  data: {
    firstname: 'John',
    lastname: 'Doe',
    username: 'johndoe',
    active: true
  }
});
```

**Drizzle:**
```typescript
const [user] = await db.insert(users).values({
  firstname: 'John',
  lastname: 'Doe',
  username: 'johndoe',
  active: true
}).returning();
```

#### Update

**Prisma:**
```typescript
const user = await prisma.users.update({
  where: { user_id: id },
  data: { active: false }
});
```

**Drizzle:**
```typescript
const [user] = await db
  .update(users)
  .set({ active: false })
  .where(eq(users.user_id, id))
  .returning();
```

#### Delete

**Prisma:**
```typescript
await prisma.users.delete({
  where: { user_id: id }
});
```

**Drizzle:**
```typescript
await db.delete(users).where(eq(users.user_id, id));
```

#### Filtering

**Prisma:**
```typescript
const transactions = await prisma.transactions.findMany({
  where: {
    is_completed: true,
    date_created: {
      gte: startDate,
      lte: endDate
    }
  },
  orderBy: {
    date_created: 'desc'
  }
});
```

**Drizzle:**
```typescript
import { and, gte, lte, desc } from 'drizzle-orm';

const transactionList = await db
  .select()
  .from(transactions)
  .where(
    and(
      eq(transactions.is_completed, true),
      gte(transactions.date_created, startDate),
      lte(transactions.date_created, endDate)
    )
  )
  .orderBy(desc(transactions.date_created));
```

#### Aggregations

**Prisma:**
```typescript
const count = await prisma.transactions.count({
  where: { is_completed: true }
});

const sum = await prisma.transactions.aggregate({
  _sum: { total_cost: true },
  where: { is_paid: true }
});
```

**Drizzle:**
```typescript
import { count, sum } from 'drizzle-orm';

const [{ count: transactionCount }] = await db
  .select({ count: count() })
  .from(transactions)
  .where(eq(transactions.is_completed, true));

const [{ total }] = await db
  .select({ total: sum(transactions.total_cost) })
  .from(transactions)
  .where(eq(transactions.is_paid, true));
```

## Step-by-Step Migration Plan

### Phase 1: Preparation (Week 1)

1. **Backup Database**
   ```bash
   pg_dump -U postgres ricebikes > backup_$(date +%Y%m%d).sql
   ```

2. **Install Drizzle**
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit
   ```

3. **Create Schema Files**
   - Create all schema files in `src/db/schema/`
   - Verify table names match existing Prisma schema exactly

4. **Generate Drizzle Client**
   ```bash
   npx drizzle-kit generate
   ```

### Phase 2: Parallel Implementation (Week 2-3)

1. **Create New Repository Layer**
   - Keep existing Prisma repositories
   - Create new Drizzle repositories in parallel (e.g., `userRepository.drizzle.ts`)

2. **Migrate One Model at a Time**
   - Start with simple models (Users, Customers)
   - Then move to complex models (Transactions)

3. **Example: User Repository Migration**

**Old Prisma (`userRepository.ts`):**
```typescript
export class UserRepository {
  async findAll() {
    return prisma.users.findMany();
  }
  
  async findById(id: string) {
    return prisma.users.findUnique({ where: { user_id: id } });
  }
}
```

**New Drizzle (`userRepository.drizzle.ts`):**
```typescript
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepositoryDrizzle {
  async findAll() {
    return await db.select().from(users);
  }
  
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.user_id, id)).limit(1);
    return result[0] ?? null;
  }
}
```

4. **Feature Flag Testing**
   - Use feature flags to switch between Prisma and Drizzle
   - Test in development environment first

### Phase 3: Testing (Week 4)

1. **Unit Tests**
   - Update all repository tests
   - Ensure same data returned

2. **Integration Tests**
   - Test full workflows
   - Compare Prisma vs Drizzle results

3. **Performance Testing**
   - Compare query performance
   - Monitor database connection pools

### Phase 4: Production Deployment (Week 5)

1. **Gradual Rollout**
   - Deploy with feature flag OFF
   - Enable for 10% of requests
   - Monitor errors and performance
   - Gradually increase to 100%

2. **Remove Prisma**
   ```bash
   npm uninstall prisma @prisma/client
   rm -rf prisma/
   ```

## Migration Scripts

### `src/db/migrate.ts`
```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationDb } from './client';

async function runMigrations() {
  console.log('Running migrations...');
  
  await migrate(migrationDb, { migrationsFolder: './drizzle' });
  
  console.log('Migrations complete!');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Testing Strategy

### 1. Repository Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { UserRepositoryDrizzle } from './userRepository.drizzle';

describe('UserRepository - Drizzle', () => {
  const repository = new UserRepositoryDrizzle();
  
  it('should find all users', async () => {
    const result = await repository.findAll();
    expect(Array.isArray(result)).toBe(true);
  });
  
  it('should find user by id', async () => {
    const allUsers = await repository.findAll();
    const firstUser = allUsers[0];
    
    const result = await repository.findById(firstUser.user_id);
    expect(result).toBeDefined();
    expect(result?.user_id).toBe(firstUser.user_id);
  });
});
```

### 2. Compare Results

```typescript
// Test helper to compare Prisma vs Drizzle results
async function compareResults() {
  const prismaUsers = await prisma.users.findMany();
  const drizzleUsers = await db.select().from(users);
  
  console.log('Prisma count:', prismaUsers.length);
  console.log('Drizzle count:', drizzleUsers.length);
  console.log('Match:', prismaUsers.length === drizzleUsers.length);
}
```

## Rollback Plan

### If Migration Fails:

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   git revert <commit-hash>
   npm install
   npm run build
   pm2 restart app
   ```

2. **Database State**
   - Drizzle doesn't modify existing tables
   - Can switch back to Prisma client immediately
   - No data loss risk

3. **Code Rollback**
   ```typescript
   // Use environment variable to switch
   const USE_DRIZZLE = process.env.USE_DRIZZLE === 'true';
   
   const userRepo = USE_DRIZZLE 
     ? new UserRepositoryDrizzle()
     : new UserRepository();
   ```

## Benefits of Drizzle Over Prisma

1. **Performance**: Lighter runtime, faster queries
2. **TypeScript**: Better type inference, no code generation step
3. **SQL Control**: More control over generated SQL
4. **Bundle Size**: Smaller production bundle
5. **Flexibility**: Easier to write custom queries
6. **No Schema Generation**: Direct TypeScript schema definition

## Common Pitfalls to Avoid

1. **UUID Generation**: Drizzle uses `defaultRandom()` instead of `uuid()`
2. **Timestamps**: Use `timestamp()` with appropriate precision
3. **Relations**: Must define relations explicitly for query API
4. **Transactions**: Different transaction syntax than Prisma
5. **Decimal Types**: Use `decimal()` with precision and scale

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Drizzle Queries](https://orm.drizzle.team/docs/rqb)

## Timeline Summary

- **Week 1**: Setup, schema creation
- **Week 2-3**: Parallel implementation, model migration
- **Week 4**: Testing phase
- **Week 5**: Production deployment
- **Week 6**: Monitoring and optimization

## Conclusion

This migration can be done incrementally with minimal risk. The key is to:
1. Test thoroughly in development
2. Use feature flags for gradual rollout
3. Keep Prisma as fallback during transition
4. Monitor performance and errors closely
5. Have a clear rollback plan

Once complete, you'll have a more performant, type-safe, and maintainable ORM solution.
