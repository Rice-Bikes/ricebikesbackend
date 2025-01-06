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
  responses: createApiResponse(z.array(TransactionDetailsSchema), "Success"),
});

transactionDetailsRouter.get("/", transactionDetailsController.getAllTransactionDetails);

transactionDetailsRegistry.registerPath({
  method: "get",
  path: "/transactionDetails/{id}",
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
  path: "/transactionDetails/{id}",
  tags: ["TransactionDetail"],
  request: { params: GetTransactionDetailsSchema.shape.params },
  responses: createApiResponse(TransactionDetailsSchema, "Success"),
});

transactionDetailsRouter.post(
  "/:id",
  validateRequest(CreateTransactionDetailsSchema),
  transactionDetailsController.createTransactionDetails,
);
