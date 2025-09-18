import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { dataExportController } from "./dataExportController";

export const dataExportRegistry = new OpenAPIRegistry();
export const dataExportRouter: Router = express.Router();

// Schemas for OpenAPI documentation
const ExportFiltersSchema = z.object({
  startDate: z.string().optional().openapi({
    description: "Start date for filtering (YYYY-MM-DD format)",
    example: "2024-01-01",
  }),
  endDate: z.string().optional().openapi({
    description: "End date for filtering (YYYY-MM-DD format)",
    example: "2024-12-31",
  }),
  transactionType: z.string().optional().openapi({
    description: "Filter by transaction type",
    example: "Retrospec",
  }),
  isCompleted: z.string().optional().openapi({
    description: "Filter by completion status (true/false)",
    example: "true",
  }),
  isPaid: z.string().optional().openapi({
    description: "Filter by payment status (true/false)",
    example: "true",
  }),
  includeRefurb: z.string().optional().openapi({
    description: "Include refurbishment transactions (true/false, default: true)",
    example: "true",
  }),
  includeEmployee: z.string().optional().openapi({
    description: "Include employee transactions (true/false, default: true)",
    example: "false",
  }),
});

const RepairMetricSchema = z.object({
  repair_name: z.string(),
  total_quantity: z.number(),
  total_revenue: z.number(),
  average_price: z.number(),
  transaction_count: z.number(),
  completion_rate: z.number(),
});

const TransactionSummarySchema = z.object({
  transaction_num: z.number(),
  transaction_id: z.string(),
  date_created: z.string(),
  transaction_type: z.string(),
  customer_name: z.string(),
  customer_email: z.string(),
  total_cost: z.number(),
  is_completed: z.boolean(),
  is_paid: z.boolean(),
  is_refurb: z.boolean(),
  is_employee: z.boolean(),
  date_completed: z.string().optional(),
  bike_make: z.string().optional(),
  bike_model: z.string().optional(),
  repair_items: z.string(),
  parts_items: z.string(),
});

const FinancialSummarySchema = z.object({
  total_transactions: z.number(),
  total_revenue: z.number(),
  paid_transactions: z.number(),
  paid_revenue: z.number(),
  completed_transactions: z.number(),
  pending_transactions: z.number(),
  completion_rate: z.string(),
  payment_rate: z.string(),
  average_transaction_value: z.string(),
});

const BikeInventorySchema = z.object({
  bike_id: z.string(),
  make: z.string(),
  model: z.string(),
  bike_type: z.string(),
  size_cm: z.string(),
  condition: z.string(),
  price: z.string(),
  is_available: z.string(),
  weight_kg: z.string(),
  reserved_by: z.string(),
  deposit_amount: z.string(),
  active_transactions: z.number(),
  date_created: z.string(),
});

const RepairHistorySchema = z.object({
  id: z.string(),
  transaction_id: z.string(),
  repair_id: z.string(),
  repair_name: z.string(),
  repair_description: z.string().optional(),
  repair_cost: z.number(),
  quantity: z.number(),
  total_cost: z.number(),
  transaction_date_created: z.string(),
  transaction_date_completed: z.string().optional(),
  repair_date_modified: z.string(),
  days_to_complete: z.number().optional(),
  transaction_status: z.string(),
  repair_status: z.string(),
  customer_name: z.string(),
  customer_email: z.string(),
  bike_name: z.string().optional(),
  bike_model: z.string().optional(),
  bike_brand: z.string().optional(),
});

// Register schemas
dataExportRegistry.register("ExportFilters", ExportFiltersSchema);
dataExportRegistry.register("RepairMetric", RepairMetricSchema);
dataExportRegistry.register("RepairHistory", RepairHistorySchema);
dataExportRegistry.register("TransactionSummary", TransactionSummarySchema);
dataExportRegistry.register("FinancialSummary", FinancialSummarySchema);
dataExportRegistry.register("BikeInventory", BikeInventorySchema);

// Excel Export Routes
dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/excel/full-report",
  tags: ["Data Export"],
  summary: "Export comprehensive Excel report",
  description: "Generates an Excel file with financial summary, repair metrics, and transaction details",
  request: {
    query: ExportFiltersSchema,
  },
  responses: {
    200: {
      description: "Excel file download",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: { type: "string", format: "binary" },
        },
      },
    },
    500: {
      description: "Failed to generate Excel report",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Failed to generate Excel report" },
              statusCode: { type: "number", example: 500 },
            },
          },
        },
      },
    },
  },
});

dataExportRouter.get("/excel/full-report", dataExportController.exportFullReport);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/excel/bike-inventory",
  tags: ["Data Export"],
  summary: "Export bike inventory to Excel",
  description: "Generates an Excel file with current bike inventory data",
  responses: {
    200: {
      description: "Excel file download",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: { type: "string", format: "binary" },
        },
      },
    },
    500: {
      description: "Failed to export bike inventory",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Failed to export bike inventory" },
              statusCode: { type: "number", example: 500 },
            },
          },
        },
      },
    },
  },
});

dataExportRouter.get("/excel/bike-inventory", dataExportController.exportBikeInventory);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/excel/repair-history",
  tags: ["Data Export"],
  summary: "Export repair history to Excel",
  description: "Generates an Excel file with repair history data including transaction timing",
  request: {
    query: ExportFiltersSchema,
  },
  responses: {
    200: {
      description: "Excel file download",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: { type: "string", format: "binary" },
        },
      },
    },
    500: {
      description: "Failed to export repair history",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              message: { type: "string", example: "Failed to export repair history" },
              statusCode: { type: "number", example: 500 },
            },
          },
        },
      },
    },
  },
});

dataExportRouter.get("/excel/repair-history", dataExportController.exportRepairHistory);

// JSON API Routes
dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/repair-metrics",
  tags: ["Data Export"],
  summary: "Get repair metrics data",
  description: "Returns detailed repair performance metrics as JSON",
  request: {
    query: ExportFiltersSchema,
  },
  responses: createApiResponse(z.array(RepairMetricSchema), "Repair metrics retrieved successfully"),
});

dataExportRouter.get("/repair-metrics", dataExportController.getRepairMetrics);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/transaction-summary",
  tags: ["Data Export"],
  summary: "Get transaction summary data",
  description: "Returns detailed transaction data with associated repairs and parts as JSON",
  request: {
    query: ExportFiltersSchema,
  },
  responses: createApiResponse(z.array(TransactionSummarySchema), "Transaction summary retrieved successfully"),
});

dataExportRouter.get("/transaction-summary", dataExportController.getTransactionSummary);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/financial-summary",
  tags: ["Data Export"],
  summary: "Get financial summary data",
  description: "Returns high-level financial metrics and KPIs as JSON",
  request: {
    query: ExportFiltersSchema,
  },
  responses: createApiResponse(FinancialSummarySchema, "Financial summary retrieved successfully"),
});

dataExportRouter.get("/financial-summary", dataExportController.getFinancialSummary);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/repair-history",
  tags: ["Data Export"],
  summary: "Get repair history with transaction timing",
  description: "Returns detailed repair history with transaction dates, completion times, and repair costs as JSON",
  request: {
    query: ExportFiltersSchema,
  },
  responses: createApiResponse(z.array(RepairHistorySchema), "Repair history retrieved successfully"),
});

dataExportRouter.get("/repair-history", dataExportController.getRepairHistory);

dataExportRegistry.registerPath({
  method: "get",
  path: "/data-export/bike-inventory",
  tags: ["Data Export"],
  summary: "Get bike inventory data",
  description: "Returns current bike inventory with availability and reservation status as JSON",
  responses: createApiResponse(z.array(BikeInventorySchema), "Bike inventory retrieved successfully"),
});

dataExportRouter.get("/bike-inventory", dataExportController.getBikeInventory);
