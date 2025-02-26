import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { transactionLogsController } from "./transactionLogsController";
import {
  CreateTransactionLogSchema,
  GetTransactionLogSchema,
  TransactionLogSchema,
  TransactionLogWithForeignKeysSchema,
} from "./transactionLogsModel";

export const tranasactionLogsRegistry = new OpenAPIRegistry();
export const transactionLogsRouter: Router = express.Router();

tranasactionLogsRegistry.register("TransactionDetail", TransactionLogSchema);

tranasactionLogsRegistry.registerPath({
  method: "get",
  path: "/transactionDetails",
  tags: ["TransactionDetail"],
  summary: "Get all transaction details from all transactions, including items and repairs",
  responses: createApiResponse(z.array(TransactionLogSchema), "Success"),
});

transactionLogsRouter.get("/", transactionLogsController.getAllTransactionLogs);

tranasactionLogsRegistry.registerPath({
  method: "get",
  path: "/transactionDetails/{transaction_num}",
  summary: "Get transaction details from a specific transaction, including items and repairs",
  tags: ["TransactionDetail"],
  request: {
    params: GetTransactionLogSchema.shape.params,
  },
  responses: createApiResponse(TransactionLogWithForeignKeysSchema, "Success"),
});

transactionLogsRouter.get(
  "/:transaction_num",
  // validateRequest(GetTransactionLogSchema),
  transactionLogsController.getTransactionLogs,
);

tranasactionLogsRegistry.registerPath({
  method: "post",
  path: "/transactionDetails/{transaction_id}",
  tags: ["TransactionDetail"],
  summary: "Create transaction details for a specific transaction, including an id of either a repair or an item",
  request: {
    params: CreateTransactionLogSchema.shape.params,
    body: {
      description: "Transaction Details from the user",
      content: {
        "application/json": {
          schema: CreateTransactionLogSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(TransactionLogSchema, "Success"),
});

transactionLogsRouter.post(
  "/:transaction_id",
  [validateRequest(CreateTransactionLogSchema)],
  transactionLogsController.createTransactionLogs,
);
