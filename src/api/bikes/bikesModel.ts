import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Bike = z.infer<typeof BikeSchema>;

export const BikeSchema = z.object({
  bike_id: z.string().uuid(), // SYSTEM GENERATED
  make: z.string(),
  model: z.string(),
  description: z.string().nullable(),
  date_created: z.date(), // SYSTEM GENERATED
});

// Input Validation for 'GET users/:id' endpoint
export const GetBikeSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateBikeSchema = z.object({
  body: z.object({
    make: z.string(),
    model: z.string(),
    description: z.string().nullable(),
  }),
});

export const UpdateBikeSchema = z.object({
  make: z.string().nullable(),
  model: z.string().nullable(),
  description: z.string().nullable(),
});
