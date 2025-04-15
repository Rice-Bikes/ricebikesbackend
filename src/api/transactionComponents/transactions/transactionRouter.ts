import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import {
  CreateTransactionSchema,
  DeleteTransactionSchema,
  GetAllTransactionSchema,
  GetTransactionSchema,
  PatchTransactionSchema,
  TransactionSchema,
} from "../transactions/transactionModel";
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
  request: { query: GetAllTransactionSchema.shape.query },
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

transactionRegistry.registerPath({
  method: "post",
  path: "/transactions",
  summary: "Create a transaction in the database",
  tags: ["Transactions"],
  request: {
    body: {
      description: "Transaction object",
      content: {
        "application/json": { schema: CreateTransactionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.post("/", [validateRequest(CreateTransactionSchema)], transactionsController.createTransaction);

transactionRegistry.registerPath({
  method: "put",
  path: "/transactions/{transaction_id}",
  summary: "Updates a transaction in the database",
  tags: ["Transactions"],
  request: {
    params: PatchTransactionSchema.shape.params,
    body: {
      description: "Transaction object",
      content: {
        "application/json": { schema: PatchTransactionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.put(
  "/:transaction_id",
  [validateRequest(PatchTransactionSchema)],
  transactionsController.updateTransaction,
);

transactionRegistry.registerPath({
  method: "delete",
  path: "/transactions/{transaction_id}",
  summary: "Deletes a transaction in the database",
  tags: ["Transactions"],
  request: {
    params: DeleteTransactionSchema.shape.params,
  },
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.delete(
  "/:transaction_id",
  [validateRequest(DeleteTransactionSchema)],
  transactionsController.deleteTransaction,
);

transactionRegistry.registerPath({
  method: "get",
  path: "/transactions/summary/",
  summary: "Get a summary of all transactions in the database",
  tags: ["Transactions"],
  responses: createApiResponse(TransactionSchema, "Success"),
});

transactionRouter.get("//", transactionsController.getTransactionsSummary);
