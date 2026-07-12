import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { tuneUpItemController } from "./tuneUpItemController";
import {
  CreateTuneUpItemSchema,
  GetTuneUpItemSchema,
  TuneUpItemSchema,
  UpdateTuneUpItemSchema,
} from "./tuneUpItemModel";

export const tuneUpItemRegistry = new OpenAPIRegistry();
export const tuneUpItemRouter: Router = express.Router();

tuneUpItemRegistry.register("TuneUpItem", TuneUpItemSchema);

tuneUpItemRegistry.registerPath({
  method: "get",
  path: "/tuneUpItems",
  summary: "Get all tune up items with optional filtering",
  tags: ["TuneUpItem"],
  request: {
    query: z.object({
      tune_up_id: z.string().uuid().optional(),
      repair_id: z.string().uuid().optional(),
    }),
  },
  responses: createApiResponse(z.array(TuneUpItemSchema), "Success"),
});

tuneUpItemRouter.get("/", tuneUpItemController.getTuneUpItems);

tuneUpItemRegistry.registerPath({
  method: "get",
  path: "/tuneUpItems/{id}",
  summary: "Get a tune up item by its UUID",
  tags: ["TuneUpItem"],
  request: { params: GetTuneUpItemSchema.shape.params },
  responses: createApiResponse(TuneUpItemSchema, "Success"),
});

tuneUpItemRouter.get("/:id", validateRequest(GetTuneUpItemSchema), tuneUpItemController.getTuneUpItem);

tuneUpItemRegistry.registerPath({
  method: "post",
  path: "/tuneUpItems",
  summary: "Create a new tune up item",
  tags: ["TuneUpItem"],
  request: {
    body: {
      description: "Tune up item data for creation",
      content: {
        "application/json": { schema: CreateTuneUpItemSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TuneUpItemSchema, "Success"),
});

tuneUpItemRouter.post("/", validateRequest(CreateTuneUpItemSchema), tuneUpItemController.createTuneUpItem);

tuneUpItemRegistry.registerPath({
  method: "patch",
  path: "/tuneUpItems/{id}",
  summary: "Update a tune up item",
  tags: ["TuneUpItem"],
  request: {
    params: GetTuneUpItemSchema.shape.params,
    body: {
      description: "Tune up item data for update (partial)",
      content: {
        "application/json": { schema: UpdateTuneUpItemSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TuneUpItemSchema, "Success"),
});

tuneUpItemRouter.patch("/:id", validateRequest(UpdateTuneUpItemSchema), tuneUpItemController.updateTuneUpItem);

tuneUpItemRegistry.registerPath({
  method: "delete",
  path: "/tuneUpItems/{id}",
  summary: "Delete a tune up item",
  tags: ["TuneUpItem"],
  request: { params: GetTuneUpItemSchema.shape.params },
  responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

tuneUpItemRouter.delete("/:id", validateRequest(GetTuneUpItemSchema), tuneUpItemController.deleteTuneUpItem);
