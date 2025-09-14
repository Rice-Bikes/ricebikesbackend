-- Rollback Migration: Drop WorkflowSteps table and related objects
-- Purpose: Rollback the generalized step tracking system
-- Date: 2025-09-02
-- Author: Generated for Rice Bikes Backend
-- 
-- WARNING: This will permanently delete all workflow step data!
-- Make sure to backup your data before running this rollback.

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_workflow_steps_updated_at ON "WorkflowSteps";

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop foreign key constraints
ALTER TABLE "WorkflowSteps" DROP CONSTRAINT IF EXISTS "WorkflowSteps_transaction_id_fkey";
ALTER TABLE "WorkflowSteps" DROP CONSTRAINT IF EXISTS "WorkflowSteps_created_by_fkey";
ALTER TABLE "WorkflowSteps" DROP CONSTRAINT IF EXISTS "WorkflowSteps_completed_by_fkey";

-- Drop check constraints
ALTER TABLE "WorkflowSteps" DROP CONSTRAINT IF EXISTS "WorkflowSteps_step_order_positive";
ALTER TABLE "WorkflowSteps" DROP CONSTRAINT IF EXISTS "WorkflowSteps_workflow_type_valid";

-- Drop indexes
DROP INDEX IF EXISTS "WorkflowSteps_transaction_id_idx";
DROP INDEX IF EXISTS "WorkflowSteps_workflow_type_idx";
DROP INDEX IF EXISTS "WorkflowSteps_transaction_id_workflow_type_idx";
DROP INDEX IF EXISTS "WorkflowSteps_transaction_id_workflow_type_step_order_key";

-- Drop the table
DROP TABLE IF EXISTS "WorkflowSteps";

-- Verify the table was dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'WorkflowSteps' 
  AND table_schema = 'public';
