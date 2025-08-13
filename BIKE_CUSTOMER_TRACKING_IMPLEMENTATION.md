# Bike-Customer Tracking Implementation Plan

## Overview

This document outlines the implementation plan for adding functionality to track bikes associated with customers across transactions in the Rice Bikes backend system.

## Current State Analysis

### Existing Infrastructure
- Bikes and customers are connected through the `Transactions` table
- Transaction model includes both `customer_id` and `bike_id` (optional)
- Aggregate transaction endpoints already include Customer and Bike data
- No dedicated endpoints exist for customer-bike relationship queries

### Missing Functionality
Currently, there are no endpoints that provide:
- `GET /customers/:customerId/bikes` - All bikes associated with a customer
- `GET /customers/:customerId/transactions` - All transactions for a customer
- `GET /bikes/:bikeId/transactions` - Transaction history for a specific bike

## Implementation Plan

### Phase 1: Data Models & Validation

#### 1.1 Update Customer Model (`src/api/customer/customerModel.ts`)

Add new validation schemas:

```typescript
export const GetCustomerBikesSchema = z.object({
  params: z.object({ customerId: commonValidations.uuid }),
  query: z.object({
    page_limit: z.number().int().positive().optional().default(50),
    after_id: z.number().int().positive().optional(),
    include_completed: z.boolean().optional().default(true),
  }),
});

export const GetCustomerTransactionsSchema = z.object({
  params: z.object({ customerId: commonValidations.uuid }),
  query: z.object({
    page_limit: z.number().int().positive().optional().default(50),
    after_id: z.number().int().positive().optional(),
    status: z.enum(['all', 'completed', 'pending']).optional().default('all'),
    include_bike: z.boolean().optional().default(true),
  }),
});
```

#### 1.2 Update Bike Model (`src/api/bikes/bikesModel.ts`)

Add validation schema:

```typescript
export const GetBikeTransactionsSchema = z.object({
  params: z.object({ bikeId: commonValidations.uuid }),
  query: z.object({
    page_limit: z.number().int().positive().optional().default(50),
    after_id: z.number().int().positive().optional(),
    include_customer: z.boolean().optional().default(true),
  }),
});
```

#### 1.3 Create Response Types

Add new types for enhanced responses:

```typescript
export type BikeWithTransactionInfo = Bike & {
  Transactions: (Transaction & {
    Customer: Customer;
  })[];
};

export type CustomerBikesResponse = {
  bikes: BikeWithTransactionInfo[];
  metadata: {
    total_count: number;
    has_more: boolean;
    next_cursor?: number;
  };
};
```

### Phase 2: Repository Layer Enhancement

#### 2.1 Extend Customer Repository (`src/api/customer/customerRepository.ts`)

```typescript
async findBikesByCustomerId(
  customerId: string, 
  pageLimit: number, 
  afterId?: number, 
  includeCompleted: boolean = true
): Promise<BikeWithTransactionInfo[]> {
  return prisma.bikes.findMany({
    include: {
      Transactions: {
        include: {
          Customer: true,
        },
        where: {
          customer_id: customerId,
          ...(includeCompleted ? {} : { is_completed: false }),
          ...(afterId ? { transaction_num: { lt: afterId } } : {}),
        },
        orderBy: { transaction_num: 'desc' },
      },
    },
    where: {
      Transactions: {
        some: {
          customer_id: customerId,
        },
      },
    },
    take: pageLimit,
  });
}

async findTransactionsByCustomerId(
  customerId: string,
  pageLimit: number,
  afterId?: number,
  status: 'all' | 'completed' | 'pending' = 'all',
  includeBike: boolean = true
): Promise<Transaction[]> {
  const whereClause: any = {
    customer_id: customerId,
    ...(afterId ? { transaction_num: { lt: afterId } } : {}),
  };

  if (status === 'completed') {
    whereClause.is_completed = true;
  } else if (status === 'pending') {
    whereClause.is_completed = false;
  }

  return prisma.transactions.findMany({
    include: includeBike ? { Bike: true, Customer: true } : { Customer: true },
    where: whereClause,
    orderBy: { transaction_num: 'desc' },
    take: pageLimit,
  });
}
```

#### 2.2 Extend Bike Repository (`src/api/bikes/bikesRepository.ts`)

```typescript
async findTransactionsByBikeId(
  bikeId: string,
  pageLimit: number,
  afterId?: number,
  includeCustomer: boolean = true
): Promise<Transaction[]> {
  return prisma.transactions.findMany({
    include: includeCustomer ? { Customer: true, Bike: true } : { Bike: true },
    where: {
      bike_id: bikeId,
      ...(afterId ? { transaction_num: { lt: afterId } } : {}),
    },
    orderBy: { transaction_num: 'desc' },
    take: pageLimit,
  });
}
```

### Phase 3: Service Layer Enhancement

#### 3.1 Extend Customer Service (`src/api/customer/customerService.ts`)

```typescript
async findBikesByCustomerId(
  customerId: string,
  pageLimit: number,
  afterId?: number,
  includeCompleted: boolean = true
): Promise<ServiceResponse<BikeWithTransactionInfo[] | null>> {
  try {
    const bikes = await this.CustomersRepository.findBikesByCustomerId(
      customerId, pageLimit, afterId, includeCompleted
    );
    
    if (!bikes || bikes.length === 0) {
      return ServiceResponse.failure("No bikes found for customer", null, StatusCodes.NOT_FOUND);
    }
    
    return ServiceResponse.success<BikeWithTransactionInfo[]>("Customer bikes found", bikes);
  } catch (ex) {
    const errorMessage = `Error finding bikes for customer ${customerId}: ${(ex as Error).message}`;
    logger.error(errorMessage);
    return ServiceResponse.failure(
      "An error occurred while retrieving customer bikes.",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

async findTransactionsByCustomerId(
  customerId: string,
  pageLimit: number,
  afterId?: number,
  status: 'all' | 'completed' | 'pending' = 'all',
  includeBike: boolean = true
): Promise<ServiceResponse<Transaction[] | null>> {
  try {
    const transactions = await this.CustomersRepository.findTransactionsByCustomerId(
      customerId, pageLimit, afterId, status, includeBike
    );
    
    if (!transactions || transactions.length === 0) {
      return ServiceResponse.failure("No transactions found for customer", null, StatusCodes.NOT_FOUND);
    }
    
    return ServiceResponse.success<Transaction[]>("Customer transactions found", transactions);
  } catch (ex) {
    const errorMessage = `Error finding transactions for customer ${customerId}: ${(ex as Error).message}`;
    logger.error(errorMessage);
    return ServiceResponse.failure(
      "An error occurred while retrieving customer transactions.",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}
```

#### 3.2 Extend Bike Service (`src/api/bikes/bikesService.ts`)

```typescript
async findTransactionsByBikeId(
  bikeId: string,
  pageLimit: number,
  afterId?: number,
  includeCustomer: boolean = true
): Promise<ServiceResponse<Transaction[] | null>> {
  try {
    const transactions = await this.BikesRepository.findTransactionsByBikeId(
      bikeId, pageLimit, afterId, includeCustomer
    );
    
    if (!transactions || transactions.length === 0) {
      return ServiceResponse.failure("No transactions found for bike", null, StatusCodes.NOT_FOUND);
    }
    
    return ServiceResponse.success<Transaction[]>("Bike transactions found", transactions);
  } catch (ex) {
    const errorMessage = `Error finding transactions for bike ${bikeId}: ${(ex as Error).message}`;
    logger.error(errorMessage);
    return ServiceResponse.failure(
      "An error occurred while retrieving bike transactions.",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}
```

### Phase 4: Controller Layer Enhancement

#### 4.1 Extend Customer Controller (`src/api/customer/customerController.ts`)

```typescript
public getCustomerBikes: RequestHandler = async (req: Request, res: Response) => {
  const customerId = req.params.customerId as string;
  const pageLimit = Number.parseInt(req.query.page_limit as string) || 50;
  const afterId = req.query.after_id ? Number.parseInt(req.query.after_id as string) : undefined;
  const includeCompleted = req.query.include_completed !== 'false';
  
  const serviceResponse = await customersService.findBikesByCustomerId(
    customerId, pageLimit, afterId, includeCompleted
  );
  return handleServiceResponse(serviceResponse, res);
};

public getCustomerTransactions: RequestHandler = async (req: Request, res: Response) => {
  const customerId = req.params.customerId as string;
  const pageLimit = Number.parseInt(req.query.page_limit as string) || 50;
  const afterId = req.query.after_id ? Number.parseInt(req.query.after_id as string) : undefined;
  const status = (req.query.status as 'all' | 'completed' | 'pending') || 'all';
  const includeBike = req.query.include_bike !== 'false';
  
  const serviceResponse = await customersService.findTransactionsByCustomerId(
    customerId, pageLimit, afterId, status, includeBike
  );
  return handleServiceResponse(serviceResponse, res);
};
```

#### 4.2 Extend Bike Controller (`src/api/bikes/bikesController.ts`)

```typescript
public getBikeTransactions: RequestHandler = async (req: Request, res: Response) => {
  const bikeId = req.params.bikeId as string;
  const pageLimit = Number.parseInt(req.query.page_limit as string) || 50;
  const afterId = req.query.after_id ? Number.parseInt(req.query.after_id as string) : undefined;
  const includeCustomer = req.query.include_customer !== 'false';
  
  const serviceResponse = await bikesService.findTransactionsByBikeId(
    bikeId, pageLimit, afterId, includeCustomer
  );
  return handleServiceResponse(serviceResponse, res);
};
```

### Phase 5: Router Configuration

#### 5.1 Update Customer Router (`src/api/customer/customerRouter.ts`)

```typescript
// Customer Bikes Endpoint
customerRegistry.registerPath({
  method: "get",
  path: "/customers/{customerId}/bikes",
  summary: "Get all bikes associated with a customer",
  tags: ["Customers"],
  request: { 
    params: GetCustomerBikesSchema.shape.params,
    query: GetCustomerBikesSchema.shape.query 
  },
  responses: createApiResponse(z.array(BikeSchema), "Success"),
});

customerRouter.get("/:customerId/bikes", [validateRequest(GetCustomerBikesSchema)], customerController.getCustomerBikes);

// Customer Transactions Endpoint
customerRegistry.registerPath({
  method: "get",
  path: "/customers/{customerId}/transactions",
  summary: "Get all transactions for a customer",
  tags: ["Customers"],
  request: { 
    params: GetCustomerTransactionsSchema.shape.params,
    query: GetCustomerTransactionsSchema.shape.query 
  },
  responses: createApiResponse(z.array(TransactionSchema), "Success"),
});

customerRouter.get("/:customerId/transactions", [validateRequest(GetCustomerTransactionsSchema)], customerController.getCustomerTransactions);
```

#### 5.2 Update Bike Router (`src/api/bikes/bikesRouter.ts`)

```typescript
// Bike Transactions Endpoint
bikeRegistry.registerPath({
  method: "get",
  path: "/bikes/{bikeId}/transactions",
  summary: "Get transaction history for a specific bike",
  tags: ["Bike"],
  request: { 
    params: GetBikeTransactionsSchema.shape.params,
    query: GetBikeTransactionsSchema.shape.query 
  },
  responses: createApiResponse(z.array(TransactionSchema), "Success"),
});

bikesRouter.get("/:bikeId/transactions", [validateRequest(GetBikeTransactionsSchema)], bikeController.getBikeTransactions);
```

## Important Considerations

### 1. Performance Considerations

#### Database Optimization
- **Required Indexes**:
  ```sql
  CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
  CREATE INDEX idx_transactions_bike_id ON transactions(bike_id);
  CREATE INDEX idx_transactions_transaction_num ON transactions(transaction_num);
  CREATE INDEX idx_transactions_is_completed ON transactions(is_completed);
  CREATE INDEX idx_transactions_customer_date ON transactions(customer_id, transaction_num DESC);
  CREATE INDEX idx_transactions_bike_date ON transactions(bike_id, transaction_num DESC);
  ```

#### Query Optimization
- Use cursor-based pagination with `transaction_num` for consistent ordering
- Implement query result limits to prevent large data dumps
- Consider implementing data caching for frequently accessed relationships

#### Caching Strategy
- Cache customer-bike relationships for recent transactions
- Implement cache invalidation on transaction updates
- Consider Redis for session-based caching

### 2. Data Consistency

#### Null Handling
- Handle cases where `bike_id` is null in transactions
- Provide clear messaging when no bikes are associated with a customer
- Filter out null bike_id transactions unless explicitly requested

#### Transaction States
- Distinguish between completed and pending transactions
- Allow filtering by transaction completion status
- Handle edge cases with incomplete transaction data

### 3. API Design Standards

#### Query Parameters
- **Pagination**: Default `page_limit: 50`, max `page_limit: 200`
- **Filtering**: Support status filters (`all`, `completed`, `pending`)
- **Inclusion**: Optional inclusion of related data (`include_bike`, `include_customer`)

#### Response Format
```json
{
  "success": true,
  "message": "Customer bikes found",
  "responseObject": {
    "data": [...],
    "metadata": {
      "total_count": 150,
      "has_more": true,
      "next_cursor": 12345,
      "page_limit": 50
    }
  }
}
```

#### Error Handling
- Standardized error responses for invalid UUIDs
- Appropriate HTTP status codes (404 for not found, 400 for bad requests)
- Clear error messages for validation failures

### 4. Security & Authorization

#### Access Control
- Validate customer/bike existence before querying relationships
- Implement rate limiting on new endpoints (standard: 100 requests/minute)
- Consider implementing role-based access for sensitive customer data

#### Data Privacy
- Ensure compliance with privacy requirements for customer data
- Log access to customer-bike relationship data for auditing
- Consider data anonymization for non-essential use cases

### 5. Testing Strategy

#### Unit Tests
```typescript
// Example test structure
describe('CustomerService.findBikesByCustomerId', () => {
  it('should return bikes for valid customer', async () => {
    // Test implementation
  });
  
  it('should handle customer with no bikes', async () => {
    // Test implementation
  });
  
  it('should handle null bike_id in transactions', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
- Test complete endpoint flows from request to response
- Test pagination with various parameters
- Test error scenarios (invalid UUIDs, non-existent resources)

#### Performance Tests
- Test with large datasets (1000+ transactions per customer)
- Measure query performance with various filter combinations
- Test pagination performance across large result sets

### 6. Migration & Deployment

#### Database Migrations
```sql
-- Add indexes for performance
CREATE INDEX CONCURRENTLY idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX CONCURRENTLY idx_transactions_bike_id ON transactions(bike_id);
CREATE INDEX CONCURRENTLY idx_transactions_customer_date ON transactions(customer_id, transaction_num DESC);
```

#### Deployment Strategy
1. Deploy database indexes first
2. Deploy backend changes with feature flags
3. Enable endpoints gradually (internal testing → full release)
4. Monitor performance and error rates

#### Backward Compatibility
- Existing endpoints remain unchanged
- New endpoints follow existing API patterns
- No breaking changes to current functionality

## API Usage Examples

### Get Customer's Bikes
```bash
GET /customers/123e4567-e89b-12d3-a456-426614174000/bikes?page_limit=20&include_completed=true
```

### Get Customer's Transactions
```bash
GET /customers/123e4567-e89b-12d3-a456-426614174000/transactions?status=pending&include_bike=true
```

### Get Bike's Transaction History
```bash
GET /bikes/987fcdeb-51a2-43d1-b123-426614174000/transactions?page_limit=50&include_customer=true
```

## Monitoring & Observability

### Logging
- Log all new endpoint access with performance metrics
- Log unusual access patterns (high frequency, large page sizes)
- Include customer/bike IDs in logs for debugging

### Metrics
- Track endpoint usage and response times
- Monitor database query performance
- Alert on error rates > 5%

### Health Checks
- Include new endpoint status in health check monitoring
- Test database connectivity for new queries
- Monitor cache hit rates if implemented

## Future Enhancements

### Advanced Filtering
- Date range filtering for transactions
- Transaction type filtering
- Bike status filtering (maintenance, available, etc.)

### Analytics
- Customer bike usage patterns
- Popular bike models by customer demographics
- Transaction frequency analysis

### Optimization
- GraphQL implementation for flexible queries
- Real-time updates via WebSocket
- Advanced caching with TTL-based invalidation

## Conclusion

This implementation plan provides a comprehensive approach to adding bike-customer tracking functionality while maintaining system performance, security, and maintainability. The phased approach allows for gradual implementation and testing, ensuring minimal disruption to existing functionality.

For questions or clarifications about this implementation plan, please refer to the project documentation or contact the development team.
