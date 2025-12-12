import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Item = z.infer<typeof ItemSchema>;

export const ItemSchema = z.object({
  item_id: z.string().uuid(),
  upc: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  stock: z.number().int(),
  minimum_stock: z.number().int().nullable(),
  standard_price: z.number(),
  wholesale_cost: z.number(),
  condition: z.string().nullable(),
  disabled: z.boolean(),
  managed: z.boolean().nullable(),
  category_1: z.string().nullable(),
  category_2: z.string().nullable(),
  category_3: z.string().nullable(),
  specifications: z.any().nullable(), // Assuming JSON can be any valid JSON
  features: z.any().nullable(), // Assuming JSON can be any valid JSON
});

// Input Validation for 'GET users/:id' endpoint
export const GetItemSchema = z.object({
  params: z.object({ id: z.string() }),
});

// Input Validation for 'GET items' endpoint with optional includeDisabled query parameter
export const GetItemsSchema = z.object({
  query: z.object({
    includeDisabled: z
      .string()
      .optional()
      .transform((val) => val === "true" || val === "1"),
  }),
});

export const CreateItemSchema = z.object({
  body: z.object({
    upc: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    brand: z.string().nullable(),
    stock: z.coerce.number().int().default(0), // stock should start at 0
    minimum_stock: z.coerce.number().int().nullable(),
    standard_price: z.coerce.number(),
    wholesale_cost: z.coerce.number(),
    condition: z.string().nullable(),
    disabled: z.boolean().default(false), // assume that it is not disabled on creation
    managed: z.boolean(), // not sure what this does honestly (going to change into qbp vs created)
    category_1: z.string().nullable(),
    category_2: z.string().nullable(),
    category_3: z.string().nullable(),
    specifications: z.any().nullable().optional(), // Assuming JSON can be any valid JSON
    features: z.any().nullable().optional(), // Assuming JSON can be any valid JSON
  }),
});

export const PatchItemsSchema = z.object({
  body: z.string(),
});

export const UpdateItemSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    upc: z.string().optional(),
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    brand: z.string().nullable().optional(),
    stock: z.coerce.number().int().optional(),
    minimum_stock: z.coerce.number().int().nullable().optional(),
    standard_price: z.coerce.number().optional(),
    wholesale_cost: z.coerce.number().optional(),
    condition: z.string().nullable().optional(),
    disabled: z.boolean().optional(),
    managed: z.boolean().optional(),
    category_1: z.string().nullable().optional(),
    category_2: z.string().nullable().optional(),
    category_3: z.string().nullable().optional(),
    specifications: z.any().nullable().optional(),
    features: z.any().nullable().optional(),
  }),
});

export const getCategoriesSchema = z.object({
  query: z.object({ category: z.number() }),
});
