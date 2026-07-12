import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { stepController } from "./stepsController";
import { CreateStepSchema, GetStepSchema, StepSchema, UpdateStepSchema } from "./stepsModel";

export const stepRegistry = new OpenAPIRegistry();
export const stepsRouter: Router = express.Router();

stepRegistry.register("Step", StepSchema);

stepRegistry.registerPath({
  method: "get",
  path: "/steps",
  summary: "Get all steps with optional filtering",
  tags: ["Step"],
  request: {
    query: z.object({
      transaction_id: z.string().uuid().optional(),
      bundle_id: z.string().uuid().optional(),
      completed: z.boolean().optional(),
    }),
  },
  responses: createApiResponse(z.array(StepSchema), "Success"),
});

stepsRouter.get("/", stepController.getSteps);

stepRegistry.registerPath({
  method: "get",
  path: "/steps/{id}",
  summary: "Get a step by its UUID",
  tags: ["Step"],
  request: { params: GetStepSchema.shape.params },
  responses: createApiResponse(StepSchema, "Success"),
});

stepsRouter.get("/:id", validateRequest(GetStepSchema), stepController.getStep);

stepRegistry.registerPath({
  method: "post",
  path: "/steps",
  summary: "Create a new step",
  tags: ["Step"],
  request: {
    body: {
      description: "Step data for creation",
      content: {
        "application/json": { schema: CreateStepSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(StepSchema, "Success"),
});

stepsRouter.post("/", validateRequest(CreateStepSchema), stepController.createStep);

stepRegistry.registerPath({
  method: "patch",
  path: "/steps/{id}",
  summary: "Update a step",
  tags: ["Step"],
  request: {
    params: GetStepSchema.shape.params,
    body: {
      description: "Step data for update (partial)",
      content: {
        "application/json": { schema: UpdateStepSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(StepSchema, "Success"),
});

stepsRouter.patch("/:id", validateRequest(UpdateStepSchema), stepController.updateStep);

stepRegistry.registerPath({
  method: "delete",
  path: "/steps/{id}",
  summary: "Delete a step",
  tags: ["Step"],
  request: { params: GetStepSchema.shape.params },
  responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

stepsRouter.delete("/:id", validateRequest(GetStepSchema), stepController.deleteStep);
