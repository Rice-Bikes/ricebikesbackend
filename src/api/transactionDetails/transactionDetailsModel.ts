import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { query } from "express";

extendZodWithOpenApi(z);

export type TransactionDetails = z.infer<typeof TransactionDetailsSchema>;

export const TransactionDetailsSchema = z.object({
  transaction_detail_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  item_id: z.string().length(12).nullable(), // upc
  repair_id: z.string().uuid().nullable(),
  changed_by: z.string().uuid().nullable(),
  quantity: z.number().int(),
  date_modified: z.date(),
});

// Input Validation for 'GET transactionDetails/:id' endpoint
export const GetTransactionDetailsSchema = z.object({
  params: z.object({ transaction_id: commonValidations.id }),
  // query: z.object({ item_id: z.string().uuid().nullable() }),
});

export const CreateTransactionDetailsSchema = z.object({
  body: z.object({
    item_id: z.string().length(12).nullable(), // upc
    repair_id: z.string().uuid().nullable(),
    changed_by: z.string().uuid(),
    quantity: z.number().int(),
  }),
  params: z.object({ transaction_id: commonValidations.uuid }),
});
