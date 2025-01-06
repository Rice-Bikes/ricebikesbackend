import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Customer = z.infer<typeof CustomerSchema>;

export const CustomerSchema = z.object({
  customer_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetCustomerSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
