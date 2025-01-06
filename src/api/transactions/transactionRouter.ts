import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetTransactionSchema, TransactionSchema } from "@/api/transactions/transactionModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { transactionsController } from "./transactionController";

export const transactionRegistry = new OpenAPIRegistry();
export const transactionRouter: Router = express.Router();

transactionRegistry.register("Transaction", TransactionSchema);

transactionRegistry.registerPath({
  method: "get",
  path: "/transactions",
  tags: ["Transactions"],
  responses: createApiResponse(z.array(TransactionSchema), "Success"),
});

transactionRouter.get("/", transactionsController.getTransactions);

transactionRegistry.registerPath({
  method: "get",
  path: "/transactions/{id}",
  tags: ["Transactions"],
  request: { params: GetTransactionSchema.shape.params },
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.get("/:id", validateRequest(GetTransactionSchema), transactionsController.getTransaction);
