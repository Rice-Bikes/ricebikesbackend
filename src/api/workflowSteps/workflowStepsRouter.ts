import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { workflowStepsController } from "./workflowStepsController";
import {
  CreateWorkflowStepSchema,
  UpdateWorkflowStepSchema,
  WorkflowStepSchema,
  WorkflowStepsQuerySchema,
  WorkflowTypeEnum,
} from "./workflowStepsModel";

export const workflowStepsRegistry = new OpenAPIRegistry();
export const workflowStepsRouter: Router = express.Router();

// Register schemas with OpenAPI
workflowStepsRegistry.register("WorkflowStep", WorkflowStepSchema);
workflowStepsRegistry.register("CreateWorkflowStep", CreateWorkflowStepSchema);
workflowStepsRegistry.register("UpdateWorkflowStep", UpdateWorkflowStepSchema);
workflowStepsRegistry.register("WorkflowStepsQuery", WorkflowStepsQuerySchema);

// Workflow progress response schema
const WorkflowProgressSchema = z.object({
  total_steps: z.number().int(),
  completed_steps: z.number().int(),
  progress_percentage: z.number().int(),
  current_step: z
    .object({
      step_id: z.string().uuid(),
      step_name: z.string(),
      step_order: z.number().int(),
      is_completed: z.boolean(),
      completed_at: z.string().datetime().nullable(),
    })
    .nullable(),
  is_workflow_complete: z.boolean(),
  steps_summary: z.array(
    z.object({
      step_id: z.string().uuid(),
      step_name: z.string(),
      step_order: z.number().int(),
      is_completed: z.boolean(),
      completed_at: z.string().datetime().nullable(),
    }),
  ),
});

workflowStepsRegistry.register("WorkflowProgress", WorkflowProgressSchema);

// GET /workflow-steps - Get workflow steps with optional filtering
workflowStepsRegistry.registerPath({
  method: "get",
  path: "/workflow-steps",
  tags: ["Workflow Steps"],
  summary: "Get workflow steps with optional filtering",
  request: {
    query: WorkflowStepsQuerySchema,
  },
  responses: createApiResponse(z.array(WorkflowStepSchema), "Workflow steps retrieved successfully"),
});

// GET /workflow-steps/transaction/:transaction_id/:workflow_type - Get steps by transaction and workflow type
workflowStepsRegistry.registerPath({
  method: "get",
  path: "/workflow-steps/transaction/{transaction_id}/{workflow_type}",
  tags: ["Workflow Steps"],
  summary: "Get workflow steps by transaction ID and workflow type",
  request: {
    params: z.object({
      transaction_id: z.string().uuid(),
      workflow_type: WorkflowTypeEnum,
    }),
  },
  responses: createApiResponse(z.array(WorkflowStepSchema), "Workflow steps retrieved successfully"),
});

// GET /workflow-steps/:step_id - Get a single workflow step by ID
workflowStepsRegistry.registerPath({
  method: "get",
  path: "/workflow-steps/{step_id}",
  tags: ["Workflow Steps"],
  summary: "Get a workflow step by ID",
  request: {
    params: z.object({
      step_id: z.string().uuid(),
    }),
  },
  responses: createApiResponse(WorkflowStepSchema, "Workflow step retrieved successfully"),
});

// POST /workflow-steps - Create a new workflow step
workflowStepsRegistry.registerPath({
  method: "post",
  path: "/workflow-steps",
  tags: ["Workflow Steps"],
  summary: "Create a new workflow step",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateWorkflowStepSchema,
        },
      },
    },
  },
  responses: createApiResponse(WorkflowStepSchema, "Workflow step created successfully"),
});

// POST /workflow-steps/initialize/bike-sales/:transaction_id - Initialize bike sales workflow
workflowStepsRegistry.registerPath({
  method: "post",
  path: "/workflow-steps/initialize/bike-sales/{transaction_id}",
  tags: ["Workflow Steps"],
  summary: "Initialize bike sales workflow for a transaction",
  description: "Creates all 4 steps of the bike sales process: Creation → Build → Reservation → Checkout",
  request: {
    params: z.object({
      transaction_id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            created_by: z.string().uuid().optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(z.array(WorkflowStepSchema), "Bike sales workflow initialized successfully"),
});

// PUT /workflow-steps/:step_id - Update a workflow step
workflowStepsRegistry.registerPath({
  method: "put",
  path: "/workflow-steps/{step_id}",
  tags: ["Workflow Steps"],
  summary: "Update a workflow step",
  request: {
    params: z.object({
      step_id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateWorkflowStepSchema,
        },
      },
    },
  },
  responses: createApiResponse(WorkflowStepSchema, "Workflow step updated successfully"),
});

// DELETE /workflow-steps/:step_id - Delete a workflow step
workflowStepsRegistry.registerPath({
  method: "delete",
  path: "/workflow-steps/{step_id}",
  tags: ["Workflow Steps"],
  summary: "Delete a workflow step",
  request: {
    params: z.object({
      step_id: z.string().uuid(),
    }),
  },
  responses: createApiResponse(z.null(), "Workflow step deleted successfully"),
});

// GET /workflow-steps/progress/:transaction_id/:workflow_type - Get workflow progress
workflowStepsRegistry.registerPath({
  method: "get",
  path: "/workflow-steps/progress/{transaction_id}/{workflow_type}",
  tags: ["Workflow Steps"],
  summary: "Get workflow progress summary",
  description: "Returns progress statistics and current step information for a workflow",
  request: {
    params: z.object({
      transaction_id: z.string().uuid(),
      workflow_type: WorkflowTypeEnum,
    }),
  },
  responses: createApiResponse(WorkflowProgressSchema, "Workflow progress retrieved successfully"),
});

// POST /workflow-steps/complete/:step_id - Complete a workflow step
workflowStepsRegistry.registerPath({
  method: "post",
  path: "/workflow-steps/complete/{step_id}",
  tags: ["Workflow Steps"],
  summary: "Complete a workflow step",
  description: "Mark a workflow step as completed with optional user who completed it",
  request: {
    params: z.object({
      step_id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            completed_by: z.string().uuid().optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(WorkflowStepSchema, "Workflow step completed successfully"),
});

// POST /workflow-steps/uncomplete/:step_id - Uncomplete a workflow step
workflowStepsRegistry.registerPath({
  method: "post",
  path: "/workflow-steps/uncomplete/{step_id}",
  tags: ["Workflow Steps"],
  summary: "Uncomplete a workflow step",
  description: "Mark a workflow step as incomplete",
  request: {
    params: z.object({
      step_id: z.string().uuid(),
    }),
  },
  responses: createApiResponse(WorkflowStepSchema, "Workflow step marked as incomplete"),
});

// POST /workflow-steps/reset/:transaction_id - Reset workflow steps
workflowStepsRegistry.registerPath({
  method: "post",
  path: "/workflow-steps/reset/{transaction_id}",
  tags: ["Workflow Steps"],
  summary: "Reset workflow steps",
  description: "Mark all workflow steps for a transaction as incomplete",
  request: {
    params: z.object({
      transaction_id: z.string().uuid(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            workflow_type: WorkflowTypeEnum,
          }),
        },
      },
    },
  },
  responses: createApiResponse(z.array(WorkflowStepSchema), "All workflow steps reset to incomplete"),
});

// Routes
workflowStepsRouter.get("/", workflowStepsController.getWorkflowSteps);
workflowStepsRouter.get(
  "/transaction/:transaction_id/:workflow_type",
  workflowStepsController.getWorkflowStepsByTransaction,
);
workflowStepsRouter.get("/progress/:transaction_id/:workflow_type", workflowStepsController.getWorkflowProgress);
workflowStepsRouter.get("/:step_id", workflowStepsController.getWorkflowStepById);
workflowStepsRouter.post("/", workflowStepsController.createWorkflowStep);
workflowStepsRouter.post("/initialize/bike-sales/:transaction_id", workflowStepsController.initializeBikeSalesWorkflow);
workflowStepsRouter.post("/complete/:step_id", workflowStepsController.completeWorkflowStep);
workflowStepsRouter.post("/uncomplete/:step_id", workflowStepsController.uncompleteWorkflowStep);
workflowStepsRouter.post("/reset/:transaction_id", workflowStepsController.resetWorkflowSteps);
workflowStepsRouter.put("/:step_id", workflowStepsController.updateWorkflowStep);
workflowStepsRouter.delete("/:step_id", workflowStepsController.deleteWorkflowStep);
