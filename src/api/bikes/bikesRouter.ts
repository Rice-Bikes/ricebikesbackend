import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { record, z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { bikeController } from "./bikesController";
import { BikeSchema, CreateBikeSchema, GetBikeSchema } from "./bikesModel";

export const bikeRegistry = new OpenAPIRegistry();
export const bikesRouter: Router = express.Router();

bikeRegistry.register("Bike", BikeSchema);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes",
  tags: ["Bike"],
  responses: createApiResponse(z.array(BikeSchema), "Success"),
});

bikesRouter.get("/", bikeController.getBikes);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes/{id}",
  tags: ["Bike"],
  request: { params: GetBikeSchema.shape.params },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.get("/:id", [validateRequest(GetBikeSchema)], bikeController.getBike);

bikeRegistry.registerPath({
  method: "post",
  path: "/bikes/{id}",
  tags: ["Bike"],
  request: {
    params: GetBikeSchema.shape.params,
    body: {
      description: "Bike object",
      content: {
        "application/json": { schema: CreateBikeSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.post("/:id", [validateRequest(CreateBikeSchema)], bikeController.createBike);
