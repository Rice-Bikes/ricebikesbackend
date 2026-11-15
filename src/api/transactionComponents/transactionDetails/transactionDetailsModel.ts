import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { TuneUpSchema } from "@/api/tuneUpComponents/tuneUps/tuneUpModel";
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
  tune_up_id: z.string().uuid().nullable(),
  changed_by: z.string().uuid().nullable(),
  quantity: z.number().int(),
  completed: z.boolean(),
  date_modified: z.date(),
});

export const TransactionDetailsWithForeignKeysSchema = TransactionDetailsSchema.extend({
  Item: ItemSchema.optional().nullable(),
  Repair: RepairSchema.optional().nullable(),
  TuneUp: TuneUpSchema.optional().nullable(),
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
    // The user checking the repair off. Required because completing a repair is
    // recorded in the transaction's history, and a history row has to name
    // someone.
    changed_by: z.string().uuid(),
  }),
});

export const DeleteTransactionDetailsSchema = z.object({
  params: z.object({ transaction_detail_id: commonValidations.uuid }),
  // Taken from the query string rather than a body: a DELETE carries no body by
  // convention, and intermediaries are free to drop one. Required because
  // removing a part or repair is recorded in the transaction's history.
  query: z.object({ changed_by: z.string().uuid() }),
});
