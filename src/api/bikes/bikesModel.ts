import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Bike = z.infer<typeof BikeSchema>;
export type CreateBike = z.infer<typeof CreateBikeSchema>;
export type UpdateBike = z.infer<typeof UpdateBikeSchema>;

export const BikeSchema = z.object({
  bike_id: z.string().uuid(), // SYSTEM GENERATED
  make: z.string(),
  model: z.string(),
  description: z.string().nullable(),
  date_created: z.date(), // SYSTEM GENERATED
  bike_type: z.string().max(50).nullable(),
  size_cm: z.number().nullable(),
  condition: z.enum(["New", "Refurbished", "Used"]).default("Used"),
  price: z.number().min(0).nullable(),
  is_available: z.boolean().default(true),
  weight_kg: z.number().min(0.1).nullable(),
  reservation_customer_id: z.string().uuid().nullable(),
  deposit_amount: z.number().min(0).nullable(),
});

// Input Validation for 'GET bikes/:id' endpoint
export const GetBikeSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateBikeSchema = z.object({
  body: z.object({
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    description: z.string().nullable().optional(),
    bike_type: z.string().max(50).nullable().optional(),
    size_cm: z.coerce.number().nullable().optional(),
    condition: z.enum(["New", "Refurbished", "Used"]).default("Used").optional(),
    price: z.coerce.number().min(0, "Price must be non-negative").nullable().optional(),
    is_available: z.coerce.boolean().default(true).optional(),
    weight_kg: z.coerce.number().min(0.1, "Weight must be positive").nullable().optional(),
    reservation_customer_id: z.string().uuid().nullable().optional(),
    deposit_amount: z.coerce.number().min(0, "Deposit must be non-negative").nullable().optional(),
  }),
});

export const UpdateBikeSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    make: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    bike_type: z.string().max(50).nullable().optional(),
    size_cm: z.coerce.number().nullable().optional(),
    condition: z.enum(["New", "Refurbished", "Used"]).optional(),
    price: z.coerce.number().min(0, "Price must be non-negative").nullable().optional(),
    is_available: z.coerce.boolean().optional(),
    weight_kg: z.coerce.number().min(0.1, "Weight must be positive").nullable().optional(),
    reservation_customer_id: z.string().uuid().nullable().optional(),
    deposit_amount: z.coerce.number().min(0, "Deposit must be non-negative").nullable().optional(),
  }),
});

// Schema for bike queries with filters
export const GetBikesQuerySchema = z.object({
  query: z
    .object({
      bike_type: z.string().optional(),
      condition: z.enum(["New", "Refurbished", "Used"]).optional(),
      is_available: z.boolean().optional(),
      min_size: z.number().optional(),
      max_size: z.number().optional(),
      min_price: z.number().min(0).optional(),
      max_price: z.number().min(0).optional(),
    })
    .optional(),
});

// Type for creating bikes without system-generated fields
export type CreateBikeInput = Omit<Bike, "bike_id" | "date_created">;

// Type for updating bikes (all fields optional except ID)
export type UpdateBikeInput = Partial<Omit<Bike, "bike_id" | "date_created">>;
