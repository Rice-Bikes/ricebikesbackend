import { z } from "zod";

// Enum for workflow types (extensible for future workflows)
export const WorkflowTypeEnum = z.enum(["bike_sales", "repair_process", "order_fulfillment", "custom_workflow"]);

// Simplified workflow step schema - no complex JSON data
export const WorkflowStepSchema = z.object({
  step_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  workflow_type: WorkflowTypeEnum,
  step_name: z.string().min(1).max(100),
  step_order: z.number().int().min(1),
  is_completed: z.boolean().default(false),
  created_by: z.string().uuid(), // Required in database
  completed_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime(),
});

// Schema for creating new workflow steps
export const CreateWorkflowStepSchema = z.object({
  transaction_id: z.string().uuid(),
  workflow_type: WorkflowTypeEnum,
  step_name: z.string().min(1).max(100),
  step_order: z.number().int().min(1),
  created_by: z.string().uuid(), // Required since database requires it
});

// Simplified update schema - just completion status and user
export const UpdateWorkflowStepSchema = z.object({
  is_completed: z.boolean().optional(),
  completed_by: z.string().uuid().optional(),
});

// Query parameters for filtering workflow steps
export const WorkflowStepsQuerySchema = z.object({
  transaction_id: z.string().uuid().optional(),
  workflow_type: WorkflowTypeEnum.optional(),
  is_completed: z.boolean().optional(),
  step_order: z.number().int().min(1).optional(),
});

// Predefined step names for different workflow types
export const BikeStepsEnum = z.enum(["BikeSpec", "Build", "Creation", "Checkout"]);

export const RepairStepsEnum = z.enum(["Assessment", "Parts Ordering", "Repair Work", "Quality Check"]);

// Helper function to create predefined bike sales workflow steps
export function createBikeSalesWorkflowSteps(transactionId: string, createdBy: string): CreateWorkflowStep[] {
  return [
    {
      step_name: "BikeSpec",
      step_order: 1,
      workflow_type: "bike_sales",
      transaction_id: transactionId,
      created_by: createdBy,
    },
    {
      step_name: "Build",
      step_order: 2,
      workflow_type: "bike_sales",
      transaction_id: transactionId,
      created_by: createdBy,
    },
    {
      step_name: "Creation",
      step_order: 3,
      workflow_type: "bike_sales",
      transaction_id: transactionId,
      created_by: createdBy,
    },
    {
      step_name: "Checkout",
      step_order: 4,
      workflow_type: "bike_sales",
      transaction_id: transactionId,
      created_by: createdBy,
    },
  ];
} // Helper function for repair process workflow
export const createRepairWorkflowSteps = (transactionId: string, createdBy: string) => [
  {
    transaction_id: transactionId,
    workflow_type: "repair_process" as const,
    step_name: "Assessment",
    step_order: 1,
    created_by: createdBy,
  },
  {
    transaction_id: transactionId,
    workflow_type: "repair_process" as const,
    step_name: "Parts Ordering",
    step_order: 2,
    created_by: createdBy,
  },
  {
    transaction_id: transactionId,
    workflow_type: "repair_process" as const,
    step_name: "Repair Work",
    step_order: 3,
    created_by: createdBy,
  },
  {
    transaction_id: transactionId,
    workflow_type: "repair_process" as const,
    step_name: "Quality Check",
    step_order: 4,
    created_by: createdBy,
  },
];

// Type inference
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type CreateWorkflowStep = z.infer<typeof CreateWorkflowStepSchema>;
export type UpdateWorkflowStep = z.infer<typeof UpdateWorkflowStepSchema>;
export type WorkflowStepsQuery = z.infer<typeof WorkflowStepsQuerySchema>;
export type WorkflowType = z.infer<typeof WorkflowTypeEnum>;
export type BikeStepType = z.infer<typeof BikeStepsEnum>;
export type RepairStepType = z.infer<typeof RepairStepsEnum>; // Helper function to create predefined bike sales workflow steps
