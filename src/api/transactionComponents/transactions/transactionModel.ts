import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { BikeSchema } from "../../bikes/bikesModel";
import { CustomerSchema } from "../../customer/customerModel";
import { OrderRequestSchema } from "../orderRequests/orderRequestsModel";
import { TRANSACTION_VIEWS } from "./transactionViews";

extendZodWithOpenApi(z);

export type Transaction = z.infer<typeof TransactionSchema>;
export type AggTransaction = z.infer<typeof AggTransactionSchema>;
export type TransactionsSummary = z.infer<typeof TransactionsSummarySchema>;
export type UpdateTransaction = z.infer<typeof PatchTransactionSchema>;

export const TransactionSchema = z.object({
  transaction_num: z.number().int().positive(),
  transaction_id: z.string().uuid(),
  date_created: z.date().nullable(),
  transaction_type: z.string().nullable(),
  customer_id: z.string().uuid().nullable(),
  bike_id: z.string().uuid().nullable(),
  total_cost: z.number().nullable(),
  description: z.string().nullable(),
  is_completed: z.boolean().nullable(),
  is_paid: z.boolean().nullable(),
  is_refurb: z.boolean().nullable(),
  is_urgent: z.boolean().nullable(),
  is_nuclear: z.boolean().nullable(),
  is_beer_bike: z.boolean().nullable(),
  is_employee: z.boolean().nullable(),
  is_reserved: z.boolean().nullable(),
  is_waiting_on_email: z.boolean().nullable(),
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
    // Opaque cursor from a previous response's `next_cursor`. Omit for the
    // first page. A cursor is only valid for the ordering it was issued under,
    // so it cannot be carried across a change in is_completed/is_paid.
    cursor: z.string().optional(),
    type: z.string().optional(),
    aggregate: z.boolean(),
    // Named view to filter by. Omitted applies no filter. "waiting" and "paid"
    // show finished work and are ordered most-recently-completed first; the
    // rest show outstanding work and are ordered urgent first, waiting-on-email
    // last, oldest first in between.
    view: z.enum(TRANSACTION_VIEWS).optional(),
    // Whether transactions belonging to employees are included. Defaults to
    // false, which hides them from both the rows and the total.
    show_employees: z.boolean().optional(),
  }),
});

export const GetTransactionSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
});

export const CreateTransactionSchema = z.object({
  body: z.object({
    // transaction_num: z.number().int().positive(), // created with serial on backend
    transaction_type: z.string(),
    customer_id: z.string().uuid().nullable(),
    // The user creating the transaction. Required because the backend writes
    // the transaction's history itself, and a history row has to name someone.
    changed_by: z.string().uuid(),
    // If provided, the step bundle's steps are copied onto the newly
    // created transaction (see POST /stepBundles/{id}/apply).
    step_bundle_id: z.string().uuid().optional(),
    // If provided, will apply the tune up to the transaction on creation
    tune_up_id: z.string().uuid().optional(),
    // If provided and greater than 1, creates that many independent copies
    // of this transaction (each gets its own transaction_id/transaction_num
    // and, if requested, its own step bundle/tune up applied).
    quantity: z.coerce.number().int().positive().max(100).optional(),
    // total_cost: z.number().int(), will be 0
    // description: z.string().nullable(), will be ""
    // is_completed: z.boolean(), will be false
    // is_paid: z.boolean(), cannot be possible
    // is_refurb: z.boolean(), added posthumously
    // is_urgent: z.boolean(), added posthumously
    // is_nuclear: z.boolean().nullable(), added posthumously
    // is_beer_bike: z.boolean(), added posthumously
    // is_employee: z.boolean(),
    // is_reserved: z.boolean(), added posthumously
    // is_waiting_on_email: z.boolean(), added posthumously
    // date_completed: z.date().nullable(), will be updated after
  }),
});

export const PatchTransactionSchema = z.object({
  params: z.object({ transaction_id: commonValidations.uuid }),
  body: z.object({
    // The user making the edit. Required because the backend logs every edit
    // to the transaction's history itself, and a history row has to name
    // someone. It is not a column on the transaction and is never stored on it.
    changed_by: z.string().uuid(),
    transaction_type: z.string().optional(),
    total_cost: z.number().optional(),
    description: z.string().optional(),
    is_completed: z.boolean().optional(),
    is_paid: z.boolean().optional(),
    is_refurb: z.boolean().optional(),
    is_urgent: z.boolean().optional(),
    is_nuclear: z.boolean().optional(),
    is_beer_bike: z.boolean().optional(),
    is_reserved: z.boolean().optional(),
    is_waiting_on_email: z.boolean().optional(),
    date_completed: z.string().datetime().nullable().optional(),
  }),
});

export const DeleteTransactionSchema = z.object({
  params: z.object({ transaction_id: commonValidations.uuid }),
});

export const TransactionsSummarySchema = z.object({
  quantity_incomplete: z.number().int(),
  quantity_beer_bike_incomplete: z.number().int(),
  quantity_waiting_on_pickup: z.number().int(),
  quantity_waiting_on_safety_check: z.number().int(),
});
