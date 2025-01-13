import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { ItemSchema } from "../items/itemModel";
import { RepairSchema } from "../repairs/repairModel";

extendZodWithOpenApi(z);

export type TransactionDetails = z.infer<typeof TransactionDetailsSchema>;
export type CreateTransactionDetails = z.infer<typeof CreateTransactionDetailsSchema>;
export type TransactionDetailsWithForeignKeys = z.infer<typeof TransactionDetailsWithForeignKeysSchema>;

export const TransactionDetailsSchema = z.object({
  transaction_detail_id: z.string().uuid(),
  transaction_id: z.string().uuid(),
  item_id: z.string().nullable(), // upc
  repair_id: z.string().uuid().nullable(),
  changed_by: z.string().uuid().nullable(),
  quantity: z.number().int(),
  completed: z.boolean(),
  date_modified: z.date(),
});

export const TransactionDetailsWithForeignKeysSchema = TransactionDetailsSchema.extend({
  Item: ItemSchema.optional().nullable(),
  Repair: RepairSchema.optional().nullable(),
});

// Input Validation for 'GET transactionDetails/:id' endpoint
export const GetTransactionDetailsSchema = z.object({
  params: z.object({ transaction_id: commonValidations.uuid }),
  query: z.object({
    detailType: z
      .string()
      .refine((data) => data === "repair" || data === "item")
      .optional(),
  }),
});

export const CreateTransactionDetailsSchema = z.object({
  body: z.object({
    item_id: z.string().nullable(), // upc
    repair_id: z.string().uuid().nullable(),
    changed_by: z.string().uuid(),
    quantity: z.number().int(),
  }),
  params: z.object({ transaction_id: commonValidations.uuid }),
});

export const updateTransactionDetailsSchema = z.object({
  params: z.object({ transaction_detail_id: commonValidations.uuid }),
  body: z.object({
    completed: z.boolean(),
  }),
});

export const DeleteTransactionDetailsSchema = z.object({
  params: z.object({ transaction_detail_id: commonValidations.uuid }),
});
