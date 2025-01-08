import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { record, z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import requestLogger from "@/common/middleware/requestLogger";
import { validateRequest } from "@/common/utils/httpHandlers";
import { bikeController } from "./bikesController";
import { BikeSchema, CreateBikeSchema, GetBikeSchema } from "./bikesModel";

export const bikeRegistry = new OpenAPIRegistry();
export const bikesRouter: Router = express.Router();

bikeRegistry.register("Bike", BikeSchema);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes",
  summary: "Get all bikes in the database",
  tags: ["Bike"],
  responses: createApiResponse(z.array(BikeSchema), "Success"),
});

bikesRouter.get("/", bikeController.getBikes);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes/{id}",
  summary: "Get a bike from the database based on it's uuid",
  tags: ["Bike"],
  request: { params: GetBikeSchema.shape.params },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.get("/:id", [validateRequest(GetBikeSchema)], bikeController.getBike);

bikeRegistry.registerPath({
  method: "post",
  path: "/bikes",
  summary: "Create a bike in the database",
  tags: ["Bike"],
  request: {
    // params: GetBikeSchema.shape.params,
    body: {
      description: "Bike object",
      content: {
        "application/json": { schema: CreateBikeSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.post("/", [validateRequest(CreateBikeSchema)], bikeController.createBike);
