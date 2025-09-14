-- Migration: Create WorkflowSteps table for generalized step tracking
-- Purpose: Support bike sales workflow and other multi-step processes
-- Date: 2025-09-02
-- Author: Generated for Rice Bikes Backend

-- Create WorkflowSteps table
CREATE TABLE "WorkflowSteps" (
    "step_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transaction_id" UUID NOT NULL,
    "workflow_type" VARCHAR(50) NOT NULL,
    "step_name" VARCHAR(100) NOT NULL,
    "step_order" INTEGER NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "completed_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY ("step_id")
);

-- Create indexes for performance
CREATE INDEX "WorkflowSteps_transaction_id_idx" ON "WorkflowSteps"("transaction_id");
CREATE INDEX "WorkflowSteps_workflow_type_idx" ON "WorkflowSteps"("workflow_type");
CREATE INDEX "WorkflowSteps_transaction_id_workflow_type_idx" ON "WorkflowSteps"("transaction_id", "workflow_type");

-- Create unique constraint to prevent duplicate steps
CREATE UNIQUE INDEX "WorkflowSteps_transaction_id_workflow_type_step_order_key" ON "WorkflowSteps"("transaction_id", "workflow_type", "step_order");

-- Add foreign key constraints
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transactions"("transaction_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "Users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add check constraints for data validation
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_step_order_positive" CHECK ("step_order" > 0);
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_workflow_type_valid" CHECK ("workflow_type" IN ('bike_sales', 'repair_process', 'order_fulfillment', 'custom_workflow'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflow_steps_updated_at 
    BEFORE UPDATE ON "WorkflowSteps" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample bike sales workflow for testing (optional)
-- Uncomment the following lines if you want to create sample data

/*
-- Sample transaction (assuming one exists, replace with actual transaction_id)
-- INSERT INTO "WorkflowSteps" ("transaction_id", "workflow_type", "step_name", "step_order", "step_data")
-- VALUES 
--     ('your-transaction-id-here', 'bike_sales', 'Creation', 1, '{"bike_selected": false, "customer_confirmed": false, "frame_type": null}'),
--     ('your-transaction-id-here', 'bike_sales', 'Build', 2, '{"parts_ordered": false, "build_started": false, "estimated_completion": null}'),
--     ('your-transaction-id-here', 'bike_sales', 'Reservation', 3, '{"reservation_confirmed": false, "pickup_date": null, "deposit_paid": false}'),
--     ('your-transaction-id-here', 'bike_sales', 'Checkout', 4, '{"final_payment_completed": false, "bike_delivered": false, "customer_satisfied": false}');
*/

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
