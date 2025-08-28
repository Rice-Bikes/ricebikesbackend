import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { featureFlagsController } from "./featureFlagsController";
import { CreateFeatureFlagSchema, FeatureFlagSchema, UpdateFeatureFlagSchema } from "./featureFlagsModel";

export const featureFlagsRegistry = new OpenAPIRegistry();
export const featureFlagsRouter: Router = express.Router();

featureFlagsRegistry.registerPath({
  method: "get",
  path: "/feature-flags",
  summary: "Get all feature flags from the database",
  tags: ["FeatureFlags"],
  responses: createApiResponse(z.array(FeatureFlagSchema), "Success"),
});

featureFlagsRegistry.registerPath({
  method: "post",
  path: "/feature-flags/:flagName",
  summary: "Create a new feature flag",
  tags: ["FeatureFlags"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateFeatureFlagSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(FeatureFlagSchema, "Created"),
});

featureFlagsRegistry.registerPath({
  method: "patch",
  path: "/feature-flags/:flagName",
  request: {
    params: UpdateFeatureFlagSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateFeatureFlagSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(FeatureFlagSchema, "Success"),
});

featureFlagsRegistry.registerPath({
  method: "get",
  path: "/feature-flags/audit",
  summary: "Get the feature flag audit log",
  tags: ["FeatureFlags"],
  responses: createApiResponse(z.array(FeatureFlagSchema), "Success"),
});

featureFlagsRouter.get("/", validateRequest, featureFlagsController.getAllFlags);
featureFlagsRouter.post("/:flagName", validateRequest, featureFlagsController.createFlag);
featureFlagsRouter.patch("/:flagName", validateRequest, featureFlagsController.updateFlag);
featureFlagsRouter.get("/audit", validateRequest, featureFlagsController.getAuditLog);
