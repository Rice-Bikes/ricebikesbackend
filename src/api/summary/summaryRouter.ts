import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { transactionsController } from "./summaryController";
import { TransactionsSummarySchema } from "./summaryModel";

export const summaryRegistry = new OpenAPIRegistry();
export const summaryRouter: Router = express.Router();

summaryRegistry.register("Summary", TransactionsSummarySchema);

summaryRegistry.registerPath({
  method: "get",
  path: "/summary/transactions",
  summary: "Get a summary of all transactions in the database",
  tags: ["Summary"],
  responses: createApiResponse(TransactionsSummarySchema, "Success"),
});

summaryRouter.get("/transactions", transactionsController.getTransactionsSummary);
