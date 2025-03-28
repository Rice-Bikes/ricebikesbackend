import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { repairController } from "./repairController";
import { CreateRepairSchema, GetRepairSchema, RepairSchema } from "./repairModel";

export const repairRegistry = new OpenAPIRegistry();
export const repairRouter: Router = express.Router();

repairRegistry.register("Repair", RepairSchema);

repairRegistry.registerPath({
  method: "get",
  path: "/repairs",
  summary: "Get all repairs from the database",
  tags: ["Repairs"],
  responses: createApiResponse(z.array(RepairSchema), "Success"),
});

repairRouter.get("/", repairController.getRepairs);

repairRegistry.registerPath({
  method: "get",
  path: "/repairs/{id}",
  summary: "Get a repair from the database based on it's uuid",
  tags: ["Repairs"],
  request: { params: GetRepairSchema.shape.params },
  responses: createApiResponse(RepairSchema, "Success"),
});

repairRouter.get("/:id", [validateRequest(GetRepairSchema)], repairController.getRepair);

repairRegistry.registerPath({
  method: "post",
  path: "/repairs",
  summary: "Create a repair in the database",
  tags: ["Repairs"],
  request: {
    body: {
      description: "Repair object",
      content: {
        "application/json": { schema: CreateRepairSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(RepairSchema, "Success"),
});

repairRouter.post("/", [validateRequest(CreateRepairSchema)], repairController.createRepair);

repairRouter.patch("/:id", [validateRequest(GetRepairSchema)], repairController.updateRepair);
repairRouter.delete("/:id", [validateRequest(GetRepairSchema)], repairController.deleteRepair);
