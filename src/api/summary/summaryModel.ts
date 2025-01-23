import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type TransactionsSummary = z.infer<typeof TransactionsSummarySchema>;

export const TransactionsSummarySchema = z.object({
  quantity_incomplete: z.number().int(),
  quantity_waiting_on_pickup: z.number().int(),
  quantity_waiting_on_safety_check: z.number().int(),
});
