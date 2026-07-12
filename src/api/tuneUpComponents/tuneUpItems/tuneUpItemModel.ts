import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { RepairSchema } from "../../transactionComponents/repairs/repairModel";

extendZodWithOpenApi(z);

export type TuneUpItem = z.infer<typeof TuneUpItemSchema>;
export type CreateTuneUpItem = z.infer<typeof CreateTuneUpItemSchema>;
export type UpdateTuneUpItem = z.infer<typeof UpdateTuneUpItemSchema>;

export const TuneUpItemSchema = z.object({
  tune_up_item_id: z.string().uuid(), // SYSTEM GENERATED
  tune_up_id: z.string().uuid(),
  // The repair is inlined rather than returned as repair_id.
  Repair: RepairSchema,
});

// Input Validation for 'GET tuneUpItems/:id' endpoint
export const GetTuneUpItemSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateTuneUpItemSchema = z.object({
  body: z.object({
    tune_up_id: z.string().uuid(),
    repair_id: z.string().uuid(),
  }),
});

export const UpdateTuneUpItemSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    repair_id: z.string().uuid().optional(),
  }),
});

// Schema for tune up item queries with filters
export const GetTuneUpItemsQuerySchema = z.object({
  query: z
    .object({
      tune_up_id: z.string().uuid().optional(),
      repair_id: z.string().uuid().optional(),
    })
    .optional(),
});

// Type for creating tune up items without system-generated fields
export type CreateTuneUpItemInput = {
  tune_up_id: string;
  repair_id: string;
};

// Type for updating tune up items
export type UpdateTuneUpItemInput = {
  repair_id?: string;
};
