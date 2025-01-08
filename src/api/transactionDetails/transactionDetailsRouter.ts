import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  CreateTransactionDetailsSchema,
  GetTransactionDetailsSchema,
  TransactionDetailsSchema,
} from "@/api/transactionDetails/transactionDetailsModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { transactionDetailsController } from "./transactionDetailsController";

export const transactionDetailsRegistry = new OpenAPIRegistry();
export const transactionDetailsRouter: Router = express.Router();

transactionDetailsRegistry.register("TransactionDetail", TransactionDetailsSchema);

transactionDetailsRegistry.registerPath({
  method: "get",
  path: "/transactionDetails",
  tags: ["TransactionDetail"],
  summary: "Get all transaction details from all transactions, including items and repairs",
  responses: createApiResponse(z.array(TransactionDetailsSchema), "Success"),
});

transactionDetailsRouter.get("/", transactionDetailsController.getAllTransactionDetails);

transactionDetailsRegistry.registerPath({
  method: "get",
  path: "/transactionDetails/{transaction_id}",
  summary: "Get transaction details from a specific transaction, including items and repairs",
  tags: ["TransactionDetail"],
  request: { params: GetTransactionDetailsSchema.shape.params },
  responses: createApiResponse(TransactionDetailsSchema, "Success"),
});

transactionDetailsRouter.get(
  "/:id",
  validateRequest(GetTransactionDetailsSchema),
  transactionDetailsController.getTransactionDetails,
);

transactionDetailsRegistry.registerPath({
  method: "post",
  path: "/transactionDetails/{transaction_id}",
  tags: ["TransactionDetail"],
  summary: "Create transaction details for a specific transaction, including an id of either a repair or an item",
  request: {
    params: CreateTransactionDetailsSchema.shape.params,
    body: {
      description: "Transaction Details from the user",
      content: {
        "application/json": {
          schema: CreateTransactionDetailsSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TransactionDetailsSchema, "Success"),
});

transactionDetailsRouter.post(
  "/:transaction_id",
  [validateRequest(CreateTransactionDetailsSchema)],
  transactionDetailsController.createTransactionDetails,
);
