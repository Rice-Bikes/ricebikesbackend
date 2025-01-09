import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Item = z.infer<typeof ItemSchema>;

export const ItemSchema = z.object({
  upc: z.string().length(12),
  name: z.string(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  stock: z.number().int().nullable(),
  minimum_stock: z.number().int().nullable(),
  standard_price: z.number().int(),
  wholesale_cost: z.number().int(),
  condition: z.string().nullable(),
  disabled: z.boolean().nullable(),
  managed: z.boolean().nullable(),
  category_1: z.string().nullable(),
  category_2: z.string().nullable(),
  category_3: z.string().nullable(),
  specifications: z.any().nullable(), // Assuming JSON can be any valid JSON
  features: z.any().nullable(), // Assuming JSON can be any valid JSON
});

// Input Validation for 'GET users/:id' endpoint
export const GetItemSchema = z.object({
  params: z.object({ id: z.string().length(12) }),
});

export const CreateItemSchema = z.object({
  body: z.object({
    upc: z.string().length(12),
    name: z.string(),
    description: z.string().nullable(),
    brand: z.string().nullable(),
    // stock: z.number().int(), // stock should start at 0
    minimum_stock: z.number().int().nullable(),
    standard_price: z.number().int(),
    wholesale_cost: z.number().int(),
    condition: z.string().nullable(),
    // is_disabled: z.boolean(), // assume that it is not disabled on creation lol
    managed: z.boolean(), // don't know what this is
    category_1: z.string().nullable(),
    category_2: z.string().nullable(),
    category_3: z.string().nullable(),
  }),
});
