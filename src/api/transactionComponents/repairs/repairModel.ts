import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const RepairSchema = z.object({
  repair_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().nonnegative(),
  disabled: z.boolean(),
});
export const CreateRepairInputSchema = z.object({
  body: RepairSchema.omit({ repair_id: true }),
});
export const UpdateRepairInputSchema = CreateRepairInputSchema.partial();

export type Repair = z.infer<typeof RepairSchema>;

export type CreateRepairInput = z.infer<typeof CreateRepairInputSchema>["body"];
export type UpdateRepairInput = z.infer<typeof UpdateRepairInputSchema>;

export const GetRepairSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});
