import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { date, z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { UserSchema } from "../../security/users/userModel";
import { ItemSchema } from "../items/itemModel";

extendZodWithOpenApi(z);

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type CreateOrderRequests = z.infer<typeof CreateOrderRequestsSchema>;
export type AggOrderRequest = z.infer<typeof AggOrderRequestSchema>;

export const OrderRequestSchema = z.object({
  order_request_id: z.string().uuid(),
  created_by: z.string().uuid(),
  transaction_id: z.string().uuid(),
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
