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
  summary:
    "Get all transactions from the database, with optional query parameters for number of transactions and offset",
  tags: ["Transactions"],
  request: { query: GetTransactionSchema.shape.query },
  responses: createApiResponse(z.array(TransactionSchema), "Success"),
});

transactionRouter.get("/", transactionsController.getTransactions);

transactionRegistry.registerPath({
  method: "get",
  path: "/transactions/{id}",
  summary: "Get a transaction from the database based on it's uuid",
  tags: ["Transactions"],
  request: { params: GetTransactionSchema.shape.params },
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.get("/:id", validateRequest(GetTransactionSchema), transactionsController.getTransaction);
