import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type TuneUp = z.infer<typeof TuneUpSchema>;
export type CreateTuneUp = z.infer<typeof CreateTuneUpSchema>;
export type UpdateTuneUp = z.infer<typeof UpdateTuneUpSchema>;

export const TuneUpSchema = z.object({
  tune_up_id: z.string().uuid(), // SYSTEM GENERATED
  name: z.string(),
  cost: z.number().nonnegative(),
});

// Input Validation for 'GET tuneUps/:id' endpoint
export const GetTuneUpSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateTuneUpSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    cost: z.coerce.number().nonnegative(),
  }),
});

export const UpdateTuneUpSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    name: z.string().min(1).optional(),
    cost: z.coerce.number().nonnegative().optional(),
  }),
});

// Input validation for 'POST tuneUps/:id/apply' endpoint
export const ApplyTuneUpSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    transaction_id: z.string().uuid(),
    changed_by: z.string().uuid(),
  }),
});

// Type for creating tune ups without system-generated fields
export type CreateTuneUpInput = Omit<TuneUp, "tune_up_id">;

// Type for updating tune ups (all fields optional except ID)
export type UpdateTuneUpInput = Partial<Omit<TuneUp, "tune_up_id">>;
