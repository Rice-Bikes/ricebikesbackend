import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionSchema = z.object({
  transaction_num: z.number().int().positive(),
  date_created: z.date(),
  transaction_type: z.string(),
  customer_id: z.string().uuid(),
  bike_id: z.string().uuid().nullable(),
  total_cost: z.number().int(),
  description: z.string().nullable(),
  is_completed: z.boolean(),
  is_paid: z.boolean(),
  is_refurb: z.boolean(),
  is_urgent: z.boolean(),
  is_nuclear: z.boolean().nullable(),
  is_beer_bike: z.boolean(),
  is_employee: z.boolean(),
  is_reserved: z.boolean(),
  is_waiting_on_email: z.boolean(),
  date_completed: z.date().nullable(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetTransactionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
