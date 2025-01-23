import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { date, z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type OrderRequest = z.infer<typeof OrderRequestSchema>;
export type CreateOrderRequests = z.infer<typeof CreateOrderRequestsSchema>;

export const OrderRequestSchema = z.object({
  order_request_id: z.string().uuid(),
  created_by: z.string().uuid(),
  transaction_id: z.string().uuid(),
  item_id: z.string().uuid(),
  date_created: z.date(),
  quantity: z.number().int(),
  notes: z.string().nullable(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetOrderRequestsSchema = z.object({
  params: z.object({ id: z.string() }),
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
