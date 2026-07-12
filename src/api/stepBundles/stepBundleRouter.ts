import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { StepSchema } from "@/api/steps/stepsModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { stepBundleController } from "./stepBundleController";
import {
  ApplyStepBundleSchema,
  CreateStepBundleSchema,
  GetStepBundleSchema,
  StepBundleSchema,
  UpdateStepBundleSchema,
} from "./stepBundleModel";

export const stepBundleRegistry = new OpenAPIRegistry();
export const stepBundleRouter: Router = express.Router();

stepBundleRegistry.register("StepBundle", StepBundleSchema);

stepBundleRegistry.registerPath({
  method: "get",
  path: "/stepBundles",
  summary: "Get all step bundles",
  tags: ["StepBundle"],
  responses: createApiResponse(z.array(StepBundleSchema), "Success"),
});

stepBundleRouter.get("/", stepBundleController.getStepBundles);

stepBundleRegistry.registerPath({
  method: "get",
  path: "/stepBundles/{id}",
  summary: "Get a step bundle by its UUID",
  tags: ["StepBundle"],
  request: { params: GetStepBundleSchema.shape.params },
  responses: createApiResponse(StepBundleSchema, "Success"),
});

stepBundleRouter.get("/:id", validateRequest(GetStepBundleSchema), stepBundleController.getStepBundle);

stepBundleRegistry.registerPath({
  method: "post",
  path: "/stepBundles",
  summary: "Create a new step bundle",
  tags: ["StepBundle"],
  request: {
    body: {
      description: "Step bundle data for creation",
      content: {
        "application/json": { schema: CreateStepBundleSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(StepBundleSchema, "Success"),
});

stepBundleRouter.post("/", validateRequest(CreateStepBundleSchema), stepBundleController.createStepBundle);

stepBundleRegistry.registerPath({
  method: "patch",
  path: "/stepBundles/{id}",
  summary: "Update a step bundle",
  tags: ["StepBundle"],
  request: {
    params: GetStepBundleSchema.shape.params,
    body: {
      description: "Step bundle data for update (partial)",
      content: {
        "application/json": { schema: UpdateStepBundleSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(StepBundleSchema, "Success"),
});

stepBundleRouter.patch("/:id", validateRequest(UpdateStepBundleSchema), stepBundleController.updateStepBundle);

stepBundleRegistry.registerPath({
  method: "delete",
  path: "/stepBundles/{id}",
  summary: "Delete a step bundle",
  tags: ["StepBundle"],
  request: { params: GetStepBundleSchema.shape.params },
  responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

stepBundleRouter.delete("/:id", validateRequest(GetStepBundleSchema), stepBundleController.deleteStepBundle);

stepBundleRegistry.registerPath({
  method: "post",
  path: "/stepBundles/{id}/apply",
  summary: "Apply a step bundle to a transaction",
  description: "Copies every step currently in the bundle into the given transaction as new, independent steps.",
  tags: ["StepBundle"],
  request: {
    params: ApplyStepBundleSchema.shape.params,
    body: {
      description: "Target transaction to copy the bundle's steps into",
      content: {
        "application/json": { schema: ApplyStepBundleSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(z.array(StepSchema), "Success"),
});

stepBundleRouter.post("/:id/apply", validateRequest(ApplyStepBundleSchema), stepBundleController.applyStepBundle);
