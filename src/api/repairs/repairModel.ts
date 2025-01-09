import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Repair = z.infer<typeof RepairSchema>;

export const RepairSchema = z.object({
  repair_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().positive(),
  disabled: z.boolean(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetRepairSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateRepairSchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string().nullable(),
    price: z.number().int().positive(),
  }),
});
