import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type NextFunction, type Router } from "express";
import { RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { validateRequest } from "@/common/utils/httpHandlers";
import orderRequestsController from "./orderRequestsController";
import {
  AggOrderRequestSchema,
  CreateOrderRequestsSchema,
  DeleteOrderRequestSchema,
  GetOrderRequestsSchema,
  OrderRequestSchema,
  PatchOrderRequestSchema,
} from "./orderRequestsModel";

export const OrderRequestsRegistry = new OpenAPIRegistry();
export const OrderRequestsRouter: Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

OrderRequestsRegistry.register("OrderRequest", OrderRequestSchema);
OrderRequestsRegistry.register("AggOrderRequest", AggOrderRequestSchema);

OrderRequestsRegistry.registerPath({
  method: "get",
  path: "/OrderRequests",
  summary: "Get all OrderRequestss from the database",
  tags: ["OrderRequests"],
  responses: createApiResponse(z.array(OrderRequestSchema), "Success"),
});

OrderRequestsRouter.get("/", orderRequestsController.getOrderRequests);

OrderRequestsRegistry.registerPath({
  method: "get",
  path: "/OrderRequests/{id}",
  summary: "Get OrderRequests by transaction UUID or transaction number (accepts UUID or numeric transaction_num)",
  tags: ["OrderRequests"],
  request: { params: GetOrderRequestsSchema.shape.params },
  responses: createApiResponse(OrderRequestSchema, "Success"),
});

OrderRequestsRouter.get("/:id", [validateRequest(GetOrderRequestsSchema)], orderRequestsController.getOrderRequest);

OrderRequestsRegistry.registerPath({
  method: "post",
  path: "/OrderRequests",
  summary:
    "Create a OrderRequests in the database. The request is recorded in the transaction's history automatically, attributed to the `created_by` user.",
  tags: ["OrderRequests"],
  request: {
    body: {
      description: "OrderRequest object",
      content: {
        "application/json": { schema: CreateOrderRequestsSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(AggOrderRequestSchema, "Success"),
});

OrderRequestsRouter.post(
  "/",
  [validateRequest(CreateOrderRequestsSchema)],
  orderRequestsController.createOrderRequests,
);

OrderRequestsRegistry.registerPath({
  method: "put",
  path: "/OrderRequests/{request_id}",
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

OrderRequestsRouter.put(
  "/:request_id",
  [validateRequest(CreateOrderRequestsSchema)],
  orderRequestsController.updateOrderRequests,
);

OrderRequestsRegistry.registerPath({
  method: "patch",
  path: "/OrderRequests/{order_request_id}",
  summary:
    "Partially update an OrderRequests in the database. A change to `ordered` is recorded in the transaction's history automatically, attributed to the `changed_by` user.",
  tags: ["OrderRequests"],
  request: {
    params: PatchOrderRequestSchema.shape.params,
    body: {
      description: "Partial OrderRequest object",
      content: {
        "application/json": { schema: PatchOrderRequestSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(AggOrderRequestSchema, "Success"),
});

OrderRequestsRouter.patch(
  "/:order_request_id",
  [validateRequest(PatchOrderRequestSchema)],
  orderRequestsController.patchOrderRequests,
);

OrderRequestsRegistry.registerPath({
  method: "delete",
  path: "/OrderRequests/{request_id}",
  summary:
    "Delete an OrderRequest. The removal is recorded in the transaction's history automatically, attributed to the `changed_by` query parameter.",
  tags: ["OrderRequests"],
  request: {
    params: DeleteOrderRequestSchema.shape.params,
    query: DeleteOrderRequestSchema.shape.query,
  },
  responses: createApiResponse(OrderRequestSchema, "Success"),
});

OrderRequestsRouter.delete(
  "/:request_id",
  [validateRequest(DeleteOrderRequestSchema)],
  orderRequestsController.deleteOrderRequests,
);

const uploadMiddleware = (req: express.Request, res: express.Response, next: NextFunction) => {
  upload.single("pdf")(req, res, (err) => {
    if (err) return ServiceResponse.failure(err.message, null, 400);
    next();
  });
};

OrderRequestsRouter.post("/process-pdf", uploadMiddleware, orderRequestsController.processOrderPdf);
