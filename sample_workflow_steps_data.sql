-- Sample data for testing the WorkflowSteps system
-- This assumes you have some existing transactions and users in your database

-- First, let's create some sample workflow steps for bike sales
-- You'll need to replace these UUIDs with actual transaction_id and user_id values from your database

-- Example 1: Complete bike sales workflow
INSERT INTO "WorkflowSteps" (
    "step_id",
    "transaction_id", 
    "workflow_type",
    "step_name",
    "step_order",
    "is_completed",
    "created_by",
    "completed_by",
    "created_at",
    "completed_at",
    "updated_at"
) VALUES 
-- Replace 'YOUR_TRANSACTION_ID_HERE' with an actual transaction_id
-- Replace 'YOUR_USER_ID_HERE' with an actual user_id
(
    gen_random_uuid(),
    'YOUR_TRANSACTION_ID_HERE', 
    'bike_sales',
    'Creation',
    1,
    true,
    'YOUR_USER_ID_HERE',
    'YOUR_USER_ID_HERE',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
),
(
    gen_random_uuid(),
    'YOUR_TRANSACTION_ID_HERE', 
    'bike_sales',
    'Build',
    2,
    true,
    'YOUR_USER_ID_HERE',
    'YOUR_USER_ID_HERE',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'YOUR_TRANSACTION_ID_HERE', 
    'bike_sales',
    'Reservation',
    3,
    true,
    'YOUR_USER_ID_HERE',
    'YOUR_USER_ID_HERE',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    gen_random_uuid(),
    'YOUR_TRANSACTION_ID_HERE', 
    'bike_sales',
    'Checkout',
    4,
    false,
    'YOUR_USER_ID_HERE',
    NULL,
    NOW() - INTERVAL '3 days',
    NULL,
    NOW() - INTERVAL '3 days'
);

-- Example 2: Repair workflow in progress
INSERT INTO "WorkflowSteps" (
    "step_id",
    "transaction_id", 
    "workflow_type",
    "step_name",
    "step_order",
    "is_completed",
    "created_by",
    "completed_by",
    "created_at",
    "completed_at",
    "updated_at"
) VALUES 
-- Replace 'ANOTHER_TRANSACTION_ID_HERE' with another actual transaction_id
(
    gen_random_uuid(),
    'ANOTHER_TRANSACTION_ID_HERE', 
    'repair_process',
    'Assessment',
    1,
    true,
    'YOUR_USER_ID_HERE',
    'YOUR_USER_ID_HERE',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'ANOTHER_TRANSACTION_ID_HERE', 
    'repair_process',
    'Parts Ordering',
    2,
    true,
    'YOUR_USER_ID_HERE',
    'YOUR_USER_ID_HERE',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    gen_random_uuid(),
    'ANOTHER_TRANSACTION_ID_HERE', 
    'repair_process',
    'Repair Work',
    3,
    false,
    'YOUR_USER_ID_HERE',
    NULL,
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'ANOTHER_TRANSACTION_ID_HERE', 
    'repair_process',
    'Quality Check',
    4,
    false,
    'YOUR_USER_ID_HERE',
    NULL,
    NOW() - INTERVAL '2 days',
    NULL,
    NOW() - INTERVAL '2 days'
);

-- Query to check existing transactions (run this first to get actual IDs):
-- SELECT transaction_id, transaction_num, transaction_type FROM "Transactions" LIMIT 5;

-- Query to check existing users (run this first to get actual IDs):  
-- SELECT user_id, username, firstname, lastname FROM "Users" LIMIT 5;
