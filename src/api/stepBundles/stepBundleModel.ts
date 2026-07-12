import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type StepBundle = z.infer<typeof StepBundleSchema>;
export type CreateStepBundle = z.infer<typeof CreateStepBundleSchema>;
export type UpdateStepBundle = z.infer<typeof UpdateStepBundleSchema>;

export const StepBundleSchema = z.object({
  bundle_id: z.string().uuid(), // SYSTEM GENERATED
  name: z.string(),
});

// Input Validation for 'GET bundles/:id' endpoint
export const GetStepBundleSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateStepBundleSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const UpdateStepBundleSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

// Input validation for 'POST bundles/:id/apply' endpoint
export const ApplyStepBundleSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    transaction_id: z.string().uuid(),
  }),
});

// Type for creating step bundles without system-generated fields
export type CreateStepBundleInput = Omit<StepBundle, "bundle_id">;

// Type for updating step bundles (all fields optional except ID)
export type UpdateStepBundleInput = Partial<Omit<StepBundle, "bundle_id">>;
