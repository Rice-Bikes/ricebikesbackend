import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { BikeSchema } from "../bikes/bikesModel";
import { CustomerSchema } from "../customer/customerModel";

extendZodWithOpenApi(z);

export type Transaction = z.infer<typeof TransactionSchema>;
export type AggTransaction = z.infer<typeof AggTransactionSchema>;

export const TransactionSchema = z.object({
  transaction_num: z.number().int().positive(),
  transaction_id: z.string().uuid(),
  date_created: z.date(),
  transaction_type: z.string(),
  customer_id: z.string().uuid(),
  bike_id: z.string().uuid().nullable(),
  total_cost: z.number().int(),
  description: z.string().nullable(),
  is_completed: z.boolean(),
  is_paid: z.boolean(),
  is_refurb: z.boolean(),
  is_urgent: z.boolean(),
  is_nuclear: z.boolean().nullable(),
  is_beer_bike: z.boolean(),
  is_employee: z.boolean(),
  is_reserved: z.boolean(),
  is_waiting_on_email: z.boolean(),
  date_completed: z.date().nullable(),
});

export const AggTransactionSchema = z.object({
  transaction_num: z.number().int().positive(),
  transaction_id: z.string().uuid(),
  date_created: z.date(),
  transaction_type: z.string(),
  customer_id: z.string().uuid(),
  bike_id: z.string().uuid().nullable(),
  total_cost: z.number().int(),
  description: z.string().nullable(),
  is_completed: z.boolean(),
  is_paid: z.boolean(),
  is_refurb: z.boolean(),
  is_urgent: z.boolean(),
  is_nuclear: z.boolean().nullable(),
  is_beer_bike: z.boolean(),
  is_employee: z.boolean(),
  is_reserved: z.boolean(),
  is_waiting_on_email: z.boolean(),
  date_completed: z.date().nullable(),
  Bike: BikeSchema.nullable(),
  Customer: CustomerSchema.nullable(),
});
type transactionType = "outpatient" | "inpatient" | "refurb" | "retrospec";
// Input Validation for 'GET users/:id' endpoint
export const GetTransactionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  query: z.object({
    page_limit: z.number().int().positive(),
    after_id: z.number().int().positive().optional(),
    type: z.string().optional(),
  }),
});

export const CreateTransactionSchema = z.object({
  body: z.object({
    // transaction_num: z.number().int().positive(), // created with serial on backend
    transaction_type: z.string(),
    customer_id: z.string().uuid(),
    total_cost: z.number().int(),
    description: z.string().nullable(),
    is_completed: z.boolean(),
    is_paid: z.boolean(),
    is_refurb: z.boolean(),
    is_urgent: z.boolean(),
    is_nuclear: z.boolean().nullable(),
    is_beer_bike: z.boolean(),
    is_employee: z.boolean(),
    is_reserved: z.boolean(),
    is_waiting_on_email: z.boolean(),
    date_completed: z.date().nullable(),
  }),
});

export const PatchTransactionSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    transaction_type: z.string(),
    total_cost: z.number().int(),
    description: z.string().nullable(),
    is_completed: z.boolean(),
    is_paid: z.boolean(),
    is_refurb: z.boolean(),
    is_urgent: z.boolean(),
    is_nuclear: z.boolean().nullable(),
    is_beer_bike: z.boolean(),
    is_employee: z.boolean(),
    is_reserved: z.boolean(),
    is_waiting_on_email: z.boolean(),
    date_completed: z.date().nullable(),
  }),
});

export const DeleteTransactionSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});
