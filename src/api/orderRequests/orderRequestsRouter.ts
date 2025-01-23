import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { orderRequestsController } from "./orderRequestsController";
import { CreateOrderRequestsSchema, GetOrderRequestsSchema, OrderRequestSchema } from "./orderRequestsModel";

export const OrderRequestsRegistry = new OpenAPIRegistry();
export const OrderRequestsRouter: Router = express.Router();

OrderRequestsRegistry.register("OrderRequest", OrderRequestSchema);

OrderRequestsRegistry.registerPath({
  method: "get",
  path: "/OrderRequestss",
  summary: "Get all OrderRequestss from the database",
  tags: ["OrderRequests"],
  responses: createApiResponse(z.array(OrderRequestSchema), "Success"),
});

OrderRequestsRouter.get("/", orderRequestsController.getOrderRequests);

OrderRequestsRegistry.registerPath({
  method: "get",
  path: "/OrderRequestss/{id}",
  summary: "Get a OrderRequests from the database based on it's uuid",
  tags: ["OrderRequests"],
  request: { params: GetOrderRequestsSchema.shape.params },
  responses: createApiResponse(OrderRequestSchema, "Success"),
});

OrderRequestsRouter.get("/:id", [validateRequest(GetOrderRequestsSchema)], orderRequestsController.getOrderRequests);

OrderRequestsRegistry.registerPath({
  method: "post",
  path: "/OrderRequestss",
  summary: "Create a OrderRequests in the database",
  tags: ["OrderRequests"],
  request: {
    body: {
      description: "OrderRequest object",
      content: {
        "application/json": { schema: CreateOrderRequestsSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(OrderRequestSchema, "Success"),
});

OrderRequestsRouter.post(
  "/",
  [validateRequest(CreateOrderRequestsSchema)],
  orderRequestsController.createOrderRequests,
);
