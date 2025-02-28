import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { BikeSchema } from "../bikes/bikesModel";
import { CustomerSchema } from "../customer/customerModel";
import { OrderRequestSchema } from "../orderRequests/orderRequestsModel";

extendZodWithOpenApi(z);

export type Transaction = z.infer<typeof TransactionSchema>;
export type AggTransaction = z.infer<typeof AggTransactionSchema>;
export type TransactionsSummary = z.infer<typeof TransactionsSummarySchema>;
export type UpdateTransaction = z.infer<typeof PatchTransactionSchema>;

export const TransactionSchema = z.object({
  transaction_num: z.number().int().positive(),
  transaction_id: z.string().uuid(),
  date_created: z.date(),
  transaction_type: z.string(),
  customer_id: z.string().uuid(),
  bike_id: z.string().uuid().nullable(),
  total_cost: z.number(),
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
  total_cost: z.number(),
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
  OrderRequests: z.array(OrderRequestSchema).nullable(),
});
type transactionType = "outpatient" | "inpatient" | "refurb" | "retrospec";
// Input Validation for 'GET users/:id' endpoint
export const GetAllTransactionSchema = z.object({
  // params: z.object({ id: commonValidations.id }),
  query: z.object({
    page_limit: z.number().int().positive(),
    after_id: z.number().int().positive().optional(),
    type: z.string().optional(),
    aggregate: z.boolean(),
  }),
});

export const GetTransactionSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateTransactionSchema = z.object({
  body: z.object({
    // transaction_num: z.number().int().positive(), // created with serial on backend
    transaction_type: z.string(),
    customer_id: z.string().uuid(),
    // total_cost: z.number().int(), will be 0
    // description: z.string().nullable(), will be ""
    // is_completed: z.boolean(), will be false
    // is_paid: z.boolean(), cannot be possible
    // is_refurb: z.boolean(), added posthumously
    // is_urgent: z.boolean(), added posthumously
    // is_nuclear: z.boolean().nullable(), added posthumously
    // is_beer_bike: z.boolean(), added posthumously
    is_employee: z.boolean(),
    // is_reserved: z.boolean(), added posthumously
    // is_waiting_on_email: z.boolean(), added posthumously
    // date_completed: z.date().nullable(), will be updated after
  }),
});

export const PatchTransactionSchema = z.object({
  params: z.object({ transaction_id: commonValidations.uuid }),
  body: z.object({
    transaction_type: z.string(),
    total_cost: z.number(),
    description: z.string().nullable(),
    is_completed: z.boolean(),
    is_paid: z.boolean(),
    is_refurb: z.boolean(),
    is_urgent: z.boolean(),
    is_nuclear: z.boolean().nullable(),
    is_beer_bike: z.boolean(),
    is_reserved: z.boolean(),
    is_waiting_on_email: z.boolean(),
    date_completed: z.string().datetime().nullable(),
  }),
});

export const DeleteTransactionSchema = z.object({
  params: z.object({ transaction_id: commonValidations.uuid }),
});

export const TransactionsSummarySchema = z.object({
  quantity_incomplete: z.number().int(),
  quantity_waiting_on_pickup: z.number().int(),
  quantity_waiting_on_safety_check: z.number().int(),
});
