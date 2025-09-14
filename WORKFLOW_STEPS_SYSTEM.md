# WorkflowSteps System Documentation

## Overview

The WorkflowSteps system provides a generalized framework for tracking multi-step processes in the Rice Bikes backend. This system was designed to handle bike sales workflows but is extensible to support any step-based business process.

## Architecture

The system follows the 5-layer architecture pattern used throughout the Rice Bikes backend:

```
WorkflowSteps/
├── workflowStepsModel.ts       # Zod schemas and validation
├── workflowStepsRepository.ts  # Database operations
├── workflowStepsService.ts     # Business logic
├── workflowStepsController.ts  # HTTP request handling
└── workflowStepsRouter.ts      # API routes definition
```

## Database Schema

### WorkflowSteps Table

```sql
CREATE TABLE "WorkflowSteps" (
    "step_id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL REFERENCES "Transactions"("transaction_id"),
    "workflow_type" TEXT NOT NULL CHECK ("workflow_type" IN ('bike_sales', 'repair_process', 'order_fulfillment', 'custom_workflow')),
    "step_name" VARCHAR(100) NOT NULL,
    "step_order" INTEGER NOT NULL CHECK ("step_order" > 0),
    "is_completed" BOOLEAN DEFAULT FALSE,
    "created_by" UUID REFERENCES "Users"("user_id"),
    "completed_by" UUID REFERENCES "Users"("user_id"),
    "created_at" TIMESTAMP DEFAULT NOW(),
    "completed_at" TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT NOW()
);
```

### Key Design Decisions

- **Simplified Design**: No complex JSONB data - all business logic lives in transaction data
- **Step Order**: Integer-based ordering for reliable sorting
- **Completion Tracking**: Boolean flag with timestamps and user tracking
- **Extensible Types**: Enum supports multiple workflow types

## API Endpoints

Base URL: `/workflow-steps`

### Core Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List workflow steps with filtering |
| `POST` | `/` | Create individual workflow step |
| `GET` | `/:stepId` | Get specific workflow step |
| `PATCH` | `/:stepId` | Update workflow step (mainly completion) |
| `DELETE` | `/:stepId` | Delete workflow step |

### Workflow Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/initialize/:workflowType` | Create complete workflow for transaction |
| `GET` | `/transaction/:transactionId` | Get all steps for transaction |
| `GET` | `/progress/:transactionId/:workflowType` | Get workflow progress summary |

### Step Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/complete/:stepId` | Mark step as complete |
| `PATCH` | `/uncomplete/:stepId` | Mark step as incomplete |
| `POST` | `/batch-complete` | Mark multiple steps complete |

## Predefined Workflows

### Bike Sales Workflow
1. **Creation** - Initial bike configuration and customer setup
2. **Build** - Physical bike assembly and preparation  
3. **Reservation** - Customer reservation and deposit handling
4. **Checkout** - Final payment and delivery

### Repair Process Workflow  
1. **Assessment** - Initial damage/issue evaluation
2. **Parts Ordering** - Required components procurement
3. **Repair Work** - Actual repair execution
4. **Quality Check** - Final inspection and testing

## Usage Examples

### Initialize Bike Sales Workflow

```typescript
POST /workflow-steps/initialize/bike_sales
{
  "transaction_id": "uuid-here",
  "created_by": "user-uuid-here"
}
```

### Track Progress

```typescript
GET /workflow-steps/progress/transaction-uuid/bike_sales

Response:
{
  "total_steps": 4,
  "completed_steps": 2,
  "progress_percentage": 50,
  "current_step": { "step_name": "Reservation", ... },
  "is_workflow_complete": false,
  "steps_summary": [...]
}
```

### Complete a Step

```typescript
PATCH /workflow-steps/complete/step-uuid
{
  "completed_by": "user-uuid-here"
}
```

## Key Features

### ✅ Simplified Data Model
- No complex JSON data structures
- Focus on completion tracking
- Business logic in transaction data

### ✅ Extensible Design
- Support for multiple workflow types
- Easy to add new step types
- Configurable step sequences

### ✅ User Tracking
- Track who created each step
- Track who completed each step
- Full audit trail with timestamps

### ✅ Progress Monitoring
- Real-time progress calculations
- Current step identification
- Completion percentage tracking

### ✅ Batch Operations
- Initialize complete workflows
- Bulk step completion
- Efficient multi-step updates

## Integration Points

### Database Relations
- `transaction_id` → `Transactions` table
- `created_by` → `Users` table  
- `completed_by` → `Users` table

### API Integration
- Integrated with main server routes
- OpenAPI/Swagger documentation
- Consistent error handling patterns

### Authentication
- JWT-based authentication required
- Role-based access control compatible
- User context in all operations

## Sample Data

Use the provided `sample_workflow_steps_data.sql` to populate the database with test data. Update the placeholder UUIDs with actual transaction and user IDs from your database.

## Testing

The system includes comprehensive request/response validation and error handling. All endpoints return standardized ServiceResponse objects with appropriate HTTP status codes.

## Future Extensibility

The system is designed to easily support:
- Custom workflow types
- Dynamic step sequences
- Step dependencies
- Conditional workflows
- Integration with notification systems
- Step-level permissions

## Migration

Database migration is provided in `migrations/001_create_workflow_steps.sql`. Run this against your PostgreSQL database to create the necessary table structure.
