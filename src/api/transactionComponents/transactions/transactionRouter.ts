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
    "Get a page of transactions. The optional `view` selects a named filter (main, refurbs, beerBikes, builds, waiting, paid) and its ordering: waiting/paid show finished work ordered most-recently-completed first, the others show outstanding work ordered urgent first, waiting-on-email last, oldest first in between. Pass the response's next_cursor back as `cursor` for the following page; a cursor is only valid for the view that issued it.",
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
  summary:
    "Create a transaction in the database. If quantity is greater than 1, creates that many copies and returns an array instead of a single transaction. Creation is recorded in each transaction's history automatically, attributed to the `changed_by` user.",
  tags: ["Transactions"],
  request: {
    body: {
      description: "Transaction object",
      content: {
        "application/json": { schema: CreateTransactionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(z.union([TransactionSchema, z.array(TransactionSchema)]), "Success"),
});

transactionRouter.post("/", [validateRequest(CreateTransactionSchema)], transactionsController.createTransaction);

transactionRegistry.registerPath({
  method: "patch",
  path: "/transactions/{transaction_id}",
  summary:
    "Updates a transaction in the database. Every field this changes is recorded in the transaction's history automatically, attributed to the `changed_by` user, so clients do not post those logs themselves.",
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

transactionRouter.patch(
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
