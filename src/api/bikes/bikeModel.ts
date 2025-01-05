import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Bike = z.infer<typeof BikeSchema>;

export const BikeSchema = z.object({
  bike_id: z.string().uuid(),
  make: z.string(),
  model: z.string(),
  date_created: z.date(),
  description: z.string().nullable(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetBikeSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
