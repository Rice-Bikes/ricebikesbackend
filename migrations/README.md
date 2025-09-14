# Database Migrations for WorkflowSteps System

This directory contains SQL migration scripts for implementing the generalized workflow steps system in the Rice Bikes backend.

## Overview

The WorkflowSteps system provides a flexible, extensible way to track multi-step processes in the application, starting with bike sales workflows and supporting future workflow types.

## Migration Files

### `001_create_workflow_steps.sql` ✅ **REQUIRED**
- **Purpose**: Creates the main `WorkflowSteps` table and all associated database objects
- **Features**:
  - UUID-based primary keys
  - Foreign key relationships to Transactions and Users tables
  - JSONB support for flexible step-specific data
  - Performance indexes for common queries
  - Data validation constraints
  - Automatic timestamp updates via triggers

### `001_rollback_workflow_steps.sql` ⚠️ **ROLLBACK ONLY**
- **Purpose**: Completely removes the WorkflowSteps system (use with caution)
- **Warning**: This will permanently delete all workflow step data
- **Use case**: Development environment cleanup or emergency rollback

### `002_sample_workflow_data.sql` 🧪 **OPTIONAL - TESTING ONLY**
- **Purpose**: Inserts sample data for testing and demonstration
- **Prerequisites**: Requires existing transaction and user IDs
- **Note**: Must manually replace placeholder UUIDs before running

## Usage Instructions

### Step 1: Run the Main Migration

```sql
-- Connect to your PostgreSQL database and run:
\i /path/to/migrations/001_create_workflow_steps.sql
```

This will create:
- `WorkflowSteps` table with all columns and constraints
- Performance indexes for optimal query speed
- Foreign key relationships to existing tables
- Data validation constraints
- Automatic timestamp update trigger

### Step 2: Verify Installation

```sql
-- Verify the table was created successfully
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'WorkflowSteps' 
ORDER BY ordinal_position;
```

### Step 3: Test with Sample Data (Optional)

1. **First, get actual IDs from your database:**
   ```sql
   -- Get transaction IDs
   SELECT transaction_id FROM "Transactions" LIMIT 2;
   
   -- Get user IDs
   SELECT user_id FROM "Users" LIMIT 2;
   ```

2. **Edit the sample data file:**
   - Open `002_sample_workflow_data.sql`
   - Replace `YOUR_TRANSACTION_ID_1`, `YOUR_TRANSACTION_ID_2` with actual transaction IDs
   - Replace `YOUR_USER_ID_1` with an actual user ID

3. **Run the sample data insertion:**
   ```sql
   \i /path/to/migrations/002_sample_workflow_data.sql
   ```

## Database Schema Details

### WorkflowSteps Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `step_id` | UUID | Primary key, auto-generated |
| `transaction_id` | UUID | Foreign key to Transactions table |
| `workflow_type` | VARCHAR(50) | Type of workflow (bike_sales, repair_process, etc.) |
| `step_name` | VARCHAR(100) | Human-readable name of the step |
| `step_order` | INTEGER | Order of step in workflow (1, 2, 3, etc.) |
| `is_completed` | BOOLEAN | Whether the step has been completed |
| `step_data` | JSONB | Flexible JSON data for step-specific information |
| `created_by` | UUID | Foreign key to Users table (who created the step) |
| `completed_by` | UUID | Foreign key to Users table (who completed the step) |
| `created_at` | TIMESTAMP | When the step was created |
| `completed_at` | TIMESTAMP | When the step was completed (null if not completed) |
| `updated_at` | TIMESTAMP | Last update time (automatically updated) |

### Supported Workflow Types

Currently defined workflow types:
- `bike_sales`: 4-step bike sales process (Creation → Build → Reservation → Checkout)
- `repair_process`: Multi-step repair workflow
- `order_fulfillment`: Order processing workflow
- `custom_workflow`: Flexible workflow for custom processes

### Key Features

1. **Flexible JSON Data**: Each step can store custom data in the `step_data` JSONB column
2. **Performance Optimized**: Indexes on commonly queried columns
3. **Data Integrity**: Foreign key constraints and validation checks
4. **Audit Trail**: Complete tracking of who created/completed each step and when
5. **Extensible**: Easy to add new workflow types without schema changes

## API Integration

After running the migration, the following API endpoints will be available:

### Core Endpoints
- `GET /workflow-steps` - Get all workflow steps with filtering
- `GET /workflow-steps/transaction/{id}/{type}` - Get steps for specific transaction/workflow
- `POST /workflow-steps` - Create individual workflow step
- `PUT /workflow-steps/{id}` - Update workflow step
- `DELETE /workflow-steps/{id}` - Delete workflow step

### Specialized Endpoints  
- `POST /workflow-steps/initialize/bike-sales/{transaction_id}` - Initialize complete bike sales workflow
- `GET /workflow-steps/progress/{transaction_id}/{workflow_type}` - Get workflow progress summary

## Example API Usage

### Initialize Bike Sales Workflow
```bash
curl -X POST http://localhost:7130/workflow-steps/initialize/bike-sales/{transaction_id} \
  -H "Content-Type: application/json" \
  -d '{"created_by": "user_uuid_here"}'
```

### Get Workflow Progress
```bash
curl http://localhost:7130/workflow-steps/progress/{transaction_id}/bike_sales
```

### Update Step Data
```bash
curl -X PUT http://localhost:7130/workflow-steps/{step_id} \
  -H "Content-Type: application/json" \
  -d '{
    "is_completed": true,
    "completed_by": "user_uuid_here",
    "step_data": {"bike_selected": true, "customer_confirmed": true}
  }'
```

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Ensure Transactions and Users tables exist before running migration
   - Verify that transaction_id and user_id values exist when inserting data

2. **Unique Constraint Violations**
   - Each transaction can only have one step per workflow_type and step_order
   - Check for duplicate step orders within the same transaction/workflow

3. **JSONB Data Issues**
   - Ensure step_data is valid JSON format
   - Use appropriate JSONB operators for querying nested data

### Validation Queries

```sql
-- Check for orphaned steps (transaction doesn't exist)
SELECT ws.step_id, ws.transaction_id 
FROM "WorkflowSteps" ws 
LEFT JOIN "Transactions" t ON ws.transaction_id = t.transaction_id 
WHERE t.transaction_id IS NULL;

-- Check for duplicate step orders
SELECT transaction_id, workflow_type, step_order, COUNT(*) 
FROM "WorkflowSteps" 
GROUP BY transaction_id, workflow_type, step_order 
HAVING COUNT(*) > 1;

-- Check workflow progress across all transactions
SELECT 
    transaction_id,
    workflow_type,
    COUNT(*) as total_steps,
    SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) as completed_steps,
    ROUND((SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2) as progress_percentage
FROM "WorkflowSteps"
GROUP BY transaction_id, workflow_type
ORDER BY transaction_id, workflow_type;
```

## Rollback Instructions

⚠️ **WARNING**: Rolling back will permanently delete all workflow step data!

```sql
-- Create a backup first
CREATE TABLE "WorkflowSteps_backup" AS SELECT * FROM "WorkflowSteps";

-- Then run the rollback
\i /path/to/migrations/001_rollback_workflow_steps.sql
```

## Performance Considerations

- The table includes optimized indexes for common query patterns
- JSONB data is indexed using GIN indexes (can be added if needed)
- Foreign key relationships are indexed for join performance
- Unique constraints prevent data integrity issues

## Support

For questions or issues with the migration:
1. Check the troubleshooting section above
2. Review the API documentation in the codebase
3. Examine the sample data for usage patterns
4. Test with small datasets before production deployment
