import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { bikeController } from "./bikesController";
import { BikeSchema, CreateBikeSchema, GetBikeSchema, GetBikesQuerySchema, UpdateBikeSchema } from "./bikesModel";

export const bikeRegistry = new OpenAPIRegistry();
export const bikesRouter: Router = express.Router();

bikeRegistry.register("Bike", BikeSchema);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes",
  summary: "Get all bikes with optional filtering",
  tags: ["Bike"],
  request: {
    query: z.object({
      bike_type: z.string().optional(),
      condition: z.enum(["New", "Refurbished", "Used"]).optional(),
      is_available: z.boolean().optional(),
      min_size: z.number().optional(),
      max_size: z.number().optional(),
      min_price: z.number().optional(),
      max_price: z.number().optional(),
    }),
  },
  responses: createApiResponse(z.array(BikeSchema), "Success"),
});

bikesRouter.get("/", bikeController.getBikes);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes/available",
  summary: "Get all bikes available for sale",
  tags: ["Bike"],
  request: {
    query: z.object({
      bike_type: z.string().optional(),
      condition: z.enum(["New", "Refurbished", "Used"]).optional(),
      min_size: z.number().optional(),
      max_size: z.number().optional(),
      min_price: z.number().optional(),
      max_price: z.number().optional(),
    }),
  },
  responses: createApiResponse(z.array(BikeSchema), "Success"),
});

bikesRouter.get("/available", bikeController.getAvailableBikes);

bikeRegistry.registerPath({
  method: "get",
  path: "/bikes/{id}",
  summary: "Get a bike by its UUID",
  tags: ["Bike"],
  request: { params: GetBikeSchema.shape.params },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.get("/:id", validateRequest(GetBikeSchema), bikeController.getBike);

bikeRegistry.registerPath({
  method: "post",
  path: "/bikes",
  summary: "Create a new bike",
  tags: ["Bike"],
  request: {
    body: {
      description: "Bike data for creation",
      content: {
        "application/json": { schema: CreateBikeSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.post("/", validateRequest(CreateBikeSchema), bikeController.createBike);

bikeRegistry.registerPath({
  method: "patch",
  path: "/bikes/{id}",
  summary: "Update a bike",
  tags: ["Bike"],
  request: {
    params: GetBikeSchema.shape.params,
    body: {
      description: "Bike data for update (partial)",
      content: {
        "application/json": { schema: UpdateBikeSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.patch("/:id", validateRequest(UpdateBikeSchema), bikeController.updateBike);

bikeRegistry.registerPath({
  method: "delete",
  path: "/bikes/{id}",
  summary: "Delete a bike",
  tags: ["Bike"],
  request: { params: GetBikeSchema.shape.params },
  responses: createApiResponse(z.object({ message: z.string() }), "Success"),
});

bikesRouter.delete("/:id", validateRequest(GetBikeSchema), bikeController.deleteBike);

bikeRegistry.registerPath({
  method: "post",
  path: "/bikes/{id}/reserve",
  summary: "Reserve a bike for a customer",
  tags: ["Bike"],
  request: {
    params: GetBikeSchema.shape.params,
    body: {
      description: "Reservation data",
      content: {
        "application/json": {
          schema: z.object({
            customer_id: z.string().uuid(),
            deposit_amount: z.number().min(0).optional(),
          }),
        },
      },
    },
  },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.post("/:id/reserve", bikeController.reserveBike);

bikeRegistry.registerPath({
  method: "post",
  path: "/bikes/{id}/unreserve",
  summary: "Remove reservation from a bike",
  tags: ["Bike"],
  request: { params: GetBikeSchema.shape.params },
  responses: createApiResponse(BikeSchema, "Success"),
});

bikesRouter.post("/:id/unreserve", bikeController.unreserveBike);
