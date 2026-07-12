import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Step = z.infer<typeof StepSchema>;
export type CreateStep = z.infer<typeof CreateStepSchema>;
export type UpdateStep = z.infer<typeof UpdateStepSchema>;

export const StepSchema = z.object({
  step_id: z.string().uuid(), // SYSTEM GENERATED
  // Exactly one of transaction_id / bundle_id is set: a step either belongs
  // to a transaction, or is a template step living inside a step bundle.
  transaction_id: z.string().uuid().nullable(),
  bundle_id: z.string().uuid().nullable(),
  description: z.string(),
  completed: z.boolean().default(false),
  step_order: z.number().int().positive(), // SYSTEM GENERATED if omitted on create
});

// Input Validation for 'GET steps/:id' endpoint
export const GetStepSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateStepSchema = z.object({
  body: z
    .object({
      transaction_id: z.string().uuid().optional(),
      bundle_id: z.string().uuid().optional(),
      description: z.string(),
      completed: z.coerce.boolean().default(false).optional(),
      // No step_order means the new step order will be max_step_order + 1000
      // wrt the max step (scoped to whichever of transaction_id/bundle_id was
      // given). The sparseness of step_order allows steps to easily
      // be inserted between two other steps.
      // TODO: add endpoints that invalidate old step order them and re-order
      // them in the case that steps are partitioned too much.
      step_order: z.coerce.number().int().positive().optional(),
    })
    .refine((data) => Boolean(data.transaction_id) !== Boolean(data.bundle_id), {
      message: "Exactly one of transaction_id or bundle_id must be provided",
      path: ["transaction_id"],
    }),
});

export const UpdateStepSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    description: z.string().min(1).optional(),
    completed: z.coerce.boolean().optional(),
    step_order: z.coerce.number().int().positive().optional(),
  }),
});

// Schema for step queries with filters
export const GetStepsQuerySchema = z.object({
  query: z
    .object({
      transaction_id: z.string().uuid().optional(),
      bundle_id: z.string().uuid().optional(),
      completed: z.boolean().optional(),
    })
    .optional(),
});

// Type for creating steps without system-generated fields
export type CreateStepInput = Omit<Step, "step_id" | "step_order"> & { step_order?: number };

// Type for updating steps (all fields optional except ID)
export type UpdateStepInput = Partial<Omit<Step, "step_id" | "transaction_id" | "bundle_id">>;
