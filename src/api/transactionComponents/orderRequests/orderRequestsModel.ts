import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { date, z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { UserSchema } from "../../security/users/userModel";
import { ItemSchema } from "../items/itemModel";
// Type-only import: transactionModel.ts imports OrderRequestSchema (a value) from
// this file, so importing the Transaction value here too would create a runtime
// require cycle. `import type` is erased at compile time, so it's cycle-safe.
import type { Transaction } from "../transactions/transactionModel";

extendZodWithOpenApi(z);

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type CreateOrderRequests = z.infer<typeof CreateOrderRequestsSchema>;
export type AggOrderRequest = z.infer<typeof AggOrderRequestSchema>;
export type PatchOrderRequest = z.infer<typeof PatchOrderRequestSchema>;

export const OrderRequestSchema = z.object({
  order_request_id: z.string().uuid(),
  created_by: z.string().uuid(),
  transaction_id: z.string().uuid().nullable(),
  item_id: z.string().uuid(),
  date_created: z.date(),
  quantity: z.number().int(),
  notes: z.string().nullable(),
  ordered: z.boolean(),
});

export const AggOrderRequestSchema = z.object({
  ...OrderRequestSchema.shape,
  Item: ItemSchema,
  User: UserSchema,
  // z.custom (no runtime validation) rather than referencing TransactionSchema
  // directly, to avoid the module require cycle noted above.
  Transaction: z.custom<Transaction>().nullable(),
});

// Input Validation for 'GET /orderRequests/:id' endpoint
// Accepts either a UUID transaction_id (e.g. 'c35515f3-b4ef-4ed4-baf0-1d055a020350')
// or a numeric transaction_num (e.g. '17429')
export const GetOrderRequestsSchema = z.object({
  params: z.object({ id: z.string().uuid().or(z.string().regex(/^\d+$/)) }),
});

export const CreateOrderRequestsSchema = z.object({
  body: z.object({
    created_by: z.string().uuid(),
    transaction_id: z.string().uuid(),
    item_id: z.string().uuid(),
    quantity: z.number().int(),
    notes: z.string().nullable(),
  }),
});

export const DeleteOrderRequestSchema = z.object({
  params: z.object({ request_id: z.string().uuid() }),
  // In the query string rather than a body, as for deleting a transaction
  // detail: a DELETE carries no body by convention.
  query: z.object({ changed_by: z.string().uuid() }),
});

export const PatchOrderRequestSchema = z.object({
  params: z.object({ order_request_id: z.string().uuid() }),
  body: z.object({
    // The user making the change. Required because confirming an order is
    // recorded in the transaction's history, and a history row has to name
    // someone. It is not a column on the order request and is never stored.
    changed_by: z.string().uuid(),
    transaction_id: z.string().uuid().optional(),
    item_id: z.string().uuid().optional(),
    quantity: z.number().int().optional(),
    notes: z.string().nullable().optional(),
    ordered: z.boolean().optional(),
  }),
});
