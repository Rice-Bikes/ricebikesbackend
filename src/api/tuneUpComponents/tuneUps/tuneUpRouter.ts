import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { TransactionDetailsSchema } from "@/api/transactionComponents/transactionDetails/transactionDetailsModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { tuneUpController } from "./tuneUpController";
import {
  ApplyTuneUpSchema,
  CreateTuneUpSchema,
  GetTuneUpSchema,
  TuneUpSchema,
  UpdateTuneUpSchema,
} from "./tuneUpModel";

export const tuneUpRegistry = new OpenAPIRegistry();
export const tuneUpRouter: Router = express.Router();

tuneUpRegistry.register("TuneUp", TuneUpSchema);

tuneUpRegistry.registerPath({
  method: "get",
  path: "/tuneUps",
  summary: "Get all tune ups",
  tags: ["TuneUp"],
  responses: createApiResponse(z.array(TuneUpSchema), "Success"),
});

tuneUpRouter.get("/", tuneUpController.getTuneUps);

tuneUpRegistry.registerPath({
  method: "get",
  path: "/tuneUps/{id}",
  summary: "Get a tune up by its UUID",
  tags: ["TuneUp"],
  request: { params: GetTuneUpSchema.shape.params },
  responses: createApiResponse(TuneUpSchema, "Success"),
});

tuneUpRouter.get("/:id", validateRequest(GetTuneUpSchema), tuneUpController.getTuneUp);

tuneUpRegistry.registerPath({
  method: "post",
  path: "/tuneUps",
  summary: "Create a new tune up",
  tags: ["TuneUp"],
  request: {
    body: {
      description: "Tune up data for creation",
      content: {
        "application/json": { schema: CreateTuneUpSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TuneUpSchema, "Success"),
});

tuneUpRouter.post("/", validateRequest(CreateTuneUpSchema), tuneUpController.createTuneUp);

tuneUpRegistry.registerPath({
  method: "patch",
  path: "/tuneUps/{id}",
  summary: "Update a tune up",
  tags: ["TuneUp"],
  request: {
    params: GetTuneUpSchema.shape.params,
    body: {
      description: "Tune up data for update (partial)",
      content: {
        "application/json": { schema: UpdateTuneUpSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TuneUpSchema, "Success"),
});

tuneUpRouter.patch("/:id", validateRequest(UpdateTuneUpSchema), tuneUpController.updateTuneUp);

tuneUpRegistry.registerPath({
  method: "delete",
  path: "/tuneUps/{id}",
  summary: "Delete a tune up",
  tags: ["TuneUp"],
  request: { params: GetTuneUpSchema.shape.params },
  responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

tuneUpRouter.delete("/:id", validateRequest(GetTuneUpSchema), tuneUpController.deleteTuneUp);

tuneUpRegistry.registerPath({
  method: "post",
  path: "/tuneUps/{id}/apply",
  summary: "Apply a tune up to a transaction",
  description: "Copies every repair in the tune up into the given transaction as new transaction details.",
  tags: ["TuneUp"],
  request: {
    params: ApplyTuneUpSchema.shape.params,
    body: {
      description: "Target transaction to apply the tune up to",
      content: {
        "application/json": { schema: ApplyTuneUpSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(z.array(TransactionDetailsSchema), "Success"),
});

tuneUpRouter.post("/:id/apply", validateRequest(ApplyTuneUpSchema), tuneUpController.applyTuneUp);
