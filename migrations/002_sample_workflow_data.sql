-- Sample Data: Insert test workflow steps for demonstration
-- Purpose: Provide sample data for testing the workflow steps system
-- Date: 2025-09-02
-- Author: Generated for Rice Bikes Backend
-- 
-- Prerequisites: 
-- 1. WorkflowSteps table must exist (run 001_create_workflow_steps.sql first)
-- 2. Must have existing transactions and users in the database
-- 3. Replace the UUIDs below with actual transaction and user IDs from your database

-- NOTE: Before running this, replace these placeholder values with real UUIDs from your database:
-- - Replace 'YOUR_TRANSACTION_ID_1' with an actual transaction_id from Transactions table
-- - Replace 'YOUR_TRANSACTION_ID_2' with another actual transaction_id
-- - Replace 'YOUR_USER_ID_1' with an actual user_id from Users table

-- Sample Bike Sales Workflow (Transaction 1)
INSERT INTO "WorkflowSteps" (
    "transaction_id", 
    "workflow_type", 
    "step_name", 
    "step_order", 
    "is_completed",
    "step_data",
    "created_by"
) VALUES 
-- Bike Sales Steps for Transaction 1
(
    'YOUR_TRANSACTION_ID_1', 
    'bike_sales', 
    'Creation', 
    1, 
    true,
    '{"bike_selected": true, "customer_confirmed": true, "frame_type": "Road", "bike_model": "Trek Domane", "estimated_price": 1200}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_1', 
    'bike_sales', 
    'Build', 
    2, 
    true,
    '{"parts_ordered": true, "build_started": true, "estimated_completion": "2025-09-15T10:00:00.000Z", "assigned_mechanic": "YOUR_USER_ID_1", "notes": "Customer requested upgraded brakes"}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_1', 
    'bike_sales', 
    'Reservation', 
    3, 
    false,
    '{"reservation_confirmed": false, "pickup_date": null, "deposit_paid": false, "deposit_amount": null}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_1', 
    'bike_sales', 
    'Checkout', 
    4, 
    false,
    '{"final_payment_completed": false, "bike_delivered": false, "customer_satisfied": false, "warranty_explained": false, "receipt_provided": false}',
    'YOUR_USER_ID_1'
);

-- Sample Repair Process Workflow (Transaction 2)
INSERT INTO "WorkflowSteps" (
    "transaction_id", 
    "workflow_type", 
    "step_name", 
    "step_order", 
    "is_completed",
    "step_data",
    "created_by"
) VALUES 
-- Repair Process Steps for Transaction 2
(
    'YOUR_TRANSACTION_ID_2', 
    'repair_process', 
    'Assessment', 
    1, 
    true,
    '{"issue_identified": true, "estimated_cost": 150, "parts_needed": ["brake pads", "brake cable"], "estimated_time": "2 hours"}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_2', 
    'repair_process', 
    'Parts Ordering', 
    2, 
    true,
    '{"parts_ordered": true, "order_date": "2025-09-02T09:00:00.000Z", "expected_delivery": "2025-09-04T12:00:00.000Z", "supplier": "Park Tool Supply"}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_2', 
    'repair_process', 
    'Repair Work', 
    3, 
    false,
    '{"work_started": false, "assigned_mechanic": null, "estimated_completion": null, "notes": null}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_2', 
    'repair_process', 
    'Quality Check', 
    4, 
    false,
    '{"inspection_completed": false, "test_ride_completed": false, "customer_notified": false, "ready_for_pickup": false}',
    'YOUR_USER_ID_1'
);

-- Sample Custom Workflow
INSERT INTO "WorkflowSteps" (
    "transaction_id", 
    "workflow_type", 
    "step_name", 
    "step_order", 
    "is_completed",
    "step_data",
    "created_by"
) VALUES 
-- Custom workflow example (using Transaction 1 for simplicity)
(
    'YOUR_TRANSACTION_ID_1', 
    'custom_workflow', 
    'Initial Consultation', 
    1, 
    true,
    '{"consultation_completed": true, "customer_requirements": "Custom paint job", "estimated_timeline": "3 weeks"}',
    'YOUR_USER_ID_1'
),
(
    'YOUR_TRANSACTION_ID_1', 
    'custom_workflow', 
    'Design Approval', 
    2, 
    false,
    '{"design_submitted": false, "customer_approved": false, "revisions_needed": null}',
    'YOUR_USER_ID_1'
);

-- Update completed_at and completed_by for completed steps
UPDATE "WorkflowSteps" 
SET 
    "completed_at" = CURRENT_TIMESTAMP,
    "completed_by" = "created_by"
WHERE "is_completed" = true;

-- Query to verify the sample data was inserted correctly
SELECT 
    ws."step_id",
    ws."transaction_id",
    ws."workflow_type",
    ws."step_name",
    ws."step_order",
    ws."is_completed",
    ws."step_data",
    ws."created_at",
    ws."completed_at"
FROM "WorkflowSteps" ws
ORDER BY 
    ws."transaction_id",
    ws."workflow_type",
    ws."step_order";

-- Query to check workflow progress
SELECT 
    ws."transaction_id",
    ws."workflow_type",
    COUNT(*) as total_steps,
    SUM(CASE WHEN ws."is_completed" THEN 1 ELSE 0 END) as completed_steps,
    ROUND(
        (SUM(CASE WHEN ws."is_completed" THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 
        2
    ) as progress_percentage
FROM "WorkflowSteps" ws
GROUP BY 
    ws."transaction_id",
    ws."workflow_type"
ORDER BY 
    ws."transaction_id",
    ws."workflow_type";
