import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type TransactionDetails = z.infer<typeof TransactionDetailsSchema>;

export const TransactionDetailsSchema = z.object({
  transaction_detail_id: z.string().uuid(),
  transaction_id: z.number().int(),
  item_id: z.string().length(12).nullable(),
  repair_id: z.string().uuid().nullable(),
  changed_by: z.string().uuid().nullable(),
  quantity: z.number().int(),
  date_modified: z.date(),
});

// Input Validation for 'GET transactionDetails/:id' endpoint
export const GetTransactionDetailsSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const CreateTransactionDetailsSchema = z.object({
  body: z.object({
    transaction_id: z.number().int(),
    item_id: z.string().length(12).nullable(),
    repair_id: z.string().uuid().nullable(),
    changed_by: z.string().uuid(),
    quantity: z.number().int(),
  }),
});
