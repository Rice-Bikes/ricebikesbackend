import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { UserSchema } from "../../security/users/userModel";
// import { ItemSchema } from "../items/itemModel";
// import { RepairSchema } from "../repairs/repairModel";

extendZodWithOpenApi(z);

export type TransactionLog = z.infer<typeof TransactionLogSchema>;
export type CreateTransactionLog = z.infer<typeof CreateTransactionLogSchema>;
export type TransactionLogWithForeignKeys = z.infer<typeof TransactionLogWithForeignKeysSchema>;

export const TransactionLogSchema = z.object({
  log_id: z.string().uuid(),
  transaction_num: z.number().int(),
  changed_by: z.string().uuid(),
  date_modified: z.date(),
  change_type: z.string(),
  description: z.string(),
});

export const TransactionLogWithForeignKeysSchema = TransactionLogSchema.extend({
  // Item: ItemSchema.optional().nullable(),
  // Repair: RepairSchema.optional().nullable(),
  Users: UserSchema.optional().nullable(),
});

// Input Validation for 'GET transactionDetails/:id' endpoint
export const GetTransactionLogSchema = z.object({
  params: z.object({ transaction_id: commonValidations.id }),
  // query: z.object({
  //   detailType: z
  //     .string()
  //     .refine((data) => data === "repair" || data === "item")
  //     .optional(),
  // }),
});

export const CreateTransactionLogSchema = z.object({
  body: z.object({
    changed_by: z.string().uuid(),
    change_type: z.string(),
    description: z.string(),
  }),
  params: z.object({ transaction_id: commonValidations.id }),
});
