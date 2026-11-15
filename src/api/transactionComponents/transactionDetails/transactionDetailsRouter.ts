import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import {
  CreateTransactionDetailsSchema,
  DeleteTransactionDetailsSchema,
  GetTransactionDetailsSchema,
  TransactionDetailsSchema,
  TransactionDetailsWithForeignKeysSchema,
  updateTransactionDetailsSchema,
} from "../transactionDetails/transactionDetailsModel";
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
  request: {
    params: GetTransactionDetailsSchema.shape.params,
    query: GetTransactionDetailsSchema.shape.query,
  },
  responses: createApiResponse(TransactionDetailsWithForeignKeysSchema, "Success"),
});

transactionDetailsRouter.get(
  "/:transaction_id",
  validateRequest(GetTransactionDetailsSchema),
  transactionDetailsController.getTransactionDetails,
);

transactionDetailsRegistry.registerPath({
  method: "post",
  path: "/transactionDetails/{transaction_id}",
  tags: ["TransactionDetail"],
  summary:
    "Create transaction details for a specific transaction, including an id of either a repair or an item. The addition is recorded in the transaction's history automatically, attributed to the `changed_by` user.",
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
  responses: createApiResponse(TransactionDetailsWithForeignKeysSchema, "Success"),
});

transactionDetailsRouter.post(
  "/:transaction_id",
  [validateRequest(CreateTransactionDetailsSchema)],
  transactionDetailsController.createTransactionDetails,
);

transactionDetailsRegistry.registerPath({
  method: "patch",
  path: "/transactionDetails/{transaction_detail_id}",
  tags: ["TransactionDetail"],
  summary:
    "Update completion for a specific transaction, including an id of either a repair or an item. A change of status is recorded in the transaction's history automatically, attributed to the `changed_by` user.",
  request: {
    params: updateTransactionDetailsSchema.shape.params,
    body: {
      description: "Transaction Details from the user",
      content: {
        "application/json": {
          schema: updateTransactionDetailsSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TransactionDetailsSchema, "Success"),
});

transactionDetailsRouter.patch(
  "/:transaction_detail_id",
  [validateRequest(updateTransactionDetailsSchema)],
  transactionDetailsController.updateTransactionDetails,
);

transactionDetailsRegistry.registerPath({
  method: "delete",
  path: "/transactionDetails/{transaction_detail_id}",
  tags: ["TransactionDetail"],
  summary:
    "Delete repair/item for a specific transaction, including an id of either a repair or an item. The removal is recorded in the transaction's history automatically, attributed to the `changed_by` query parameter.",
  request: {
    params: DeleteTransactionDetailsSchema.shape.params,
    query: DeleteTransactionDetailsSchema.shape.query,
  },
  responses: createApiResponse(TransactionDetailsSchema, "Success"),
});

transactionDetailsRouter.delete(
  "/:transaction_detail_id",
  [validateRequest(DeleteTransactionDetailsSchema)],
  transactionDetailsController.deleteTransactionDetails,
);
