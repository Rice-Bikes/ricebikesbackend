import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

export type Order = z.infer<typeof OrderSchema>;
export type CreateOrder = z.infer<typeof CreateOrderSchema>;

export const OrderSchema = z.object({
  order_id: z.string().uuid(),
  order_date: z.date(),
  estimated_delivery: z.date(),
  supplier: z.string(),
  ordered_by: z.string(),
});

export const CreateOrderSchema = z.object({
  body: z.object({
    supplier: z.string(),
    ordered_by: z.string(),
    order_date: z.string().optional(),
    estimated_delivery: z.string().optional(),
  }),
});
export const GetOrderSchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({
    range: z.array(z.string()).optional(),
  }),
});
