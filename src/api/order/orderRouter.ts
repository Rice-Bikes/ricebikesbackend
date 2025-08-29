import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import orderController from "./orderController";
import { CreateOrderSchema, GetOrderSchema, OrderSchema } from "./orderModel";

export const OrderRegistry = new OpenAPIRegistry();
export const OrderRouter: Router = express.Router();

OrderRegistry.register("Order", OrderSchema);

// GET /orders
OrderRegistry.registerPath({
  method: "get",
  path: "/orders",
  summary: "Get all orders from the database",
  tags: ["Orders"],
  responses: createApiResponse(OrderSchema.array(), "Success"),
});
OrderRouter.get("/", orderController.getOrders);

// GET /orders/closest-future
OrderRegistry.registerPath({
  method: "get",
  path: "/orders/closest-future",
  summary: "Get the closest future order by order_date",
  tags: ["Orders"],
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.get("/closest-future", orderController.getClosestFutureOrder);

// GET /orders/:id
OrderRegistry.registerPath({
  method: "get",
  path: "/orders/{id}",
  summary: "Get an order from the database based on its uuid",
  tags: ["Orders"],
  request: { params: GetOrderSchema.shape.params },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.get("/:id", [validateRequest(GetOrderSchema)], orderController.getOrder);

// POST /orders
OrderRegistry.registerPath({
  method: "post",
  path: "/orders",
  summary: "Create an order in the database",
  tags: ["Orders"],
  request: {
    body: {
      description: "Order object",
      content: {
        "application/json": { schema: CreateOrderSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.post("/", [validateRequest(CreateOrderSchema)], orderController.createOrder);

// PUT /orders/:id
OrderRegistry.registerPath({
  method: "put",
  path: "/orders/{id}",
  summary: "Update an order in the database",
  tags: ["Orders"],
  request: {
    body: {
      description: "Order object",
      content: {
        "application/json": { schema: CreateOrderSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.put("/:id", [validateRequest(CreateOrderSchema)], orderController.updateOrder);

// DELETE /orders/:id
OrderRegistry.registerPath({
  method: "delete",
  path: "/orders/{id}",
  summary: "Delete an order from the database",
  tags: ["Orders"],
  request: {
    params: GetOrderSchema.shape.params,
  },
  responses: createApiResponse(OrderSchema, "Success"),
});
OrderRouter.delete("/:id", orderController.deleteOrder);

export default OrderRouter;
