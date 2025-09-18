import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { dataExportService } from "@/services/dataExportService";

// Validation schemas
const ExportFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  transactionType: z.string().optional(),
  isCompleted: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  isPaid: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  includeRefurb: z
    .string()
    .optional()
    .transform((val) => val !== "false"), // Default true
  includeEmployee: z
    .string()
    .optional()
    .transform((val) => val !== "false"), // Default true
});

class DataExportController {
  // Excel Export Routes
  public exportFullReport: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);

      const buffer = await dataExportService.generateExcelReport(filters);

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `rice-bikes-report-${timestamp}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error("Error generating Excel report:", error);
      const serviceResponse = ServiceResponse.failure("Failed to generate Excel report", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public exportRepairHistory: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);
      const buffer = await dataExportService.generateRepairHistoryExcel(filters);

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `repair-history-${timestamp}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error("Error exporting repair history:", error);
      const serviceResponse = ServiceResponse.failure("Failed to export repair history", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public exportBikeInventory: RequestHandler = async (req: Request, res: Response) => {
    try {
      const buffer = await dataExportService.generateBikeInventoryExcel();

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `bike-inventory-${timestamp}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error("Error exporting bike inventory:", error);
      const serviceResponse = ServiceResponse.failure("Failed to export bike inventory", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  // JSON API Routes
  public getRepairMetrics: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);
      const metrics = await dataExportService.getRepairMetrics(filters);

      const serviceResponse = ServiceResponse.success("Repair metrics retrieved successfully", metrics);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error("Error getting repair metrics:", error);
      const serviceResponse = ServiceResponse.failure("Failed to retrieve repair metrics", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public getTransactionSummary: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);
      const summary = await dataExportService.getTransactionSummary(filters);

      const serviceResponse = ServiceResponse.success("Transaction summary retrieved successfully", summary);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error("Error getting transaction summary:", error);
      const serviceResponse = ServiceResponse.failure("Failed to retrieve transaction summary", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public getFinancialSummary: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);
      const summary = await dataExportService.getFinancialSummary(filters);

      const serviceResponse = ServiceResponse.success("Financial summary retrieved successfully", summary);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error("Error getting financial summary:", error);
      const serviceResponse = ServiceResponse.failure("Failed to retrieve financial summary", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public getRepairHistory: RequestHandler = async (req: Request, res: Response) => {
    try {
      const filters = ExportFiltersSchema.parse(req.query);
      const history = await dataExportService.getRepairHistory(filters);

      const serviceResponse = ServiceResponse.success("Repair history retrieved successfully", history);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error("Error getting repair history:", error);
      const serviceResponse = ServiceResponse.failure("Failed to retrieve repair history", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };

  public getBikeInventory: RequestHandler = async (req: Request, res: Response) => {
    try {
      const inventory = await dataExportService.getBikeInventory();

      const serviceResponse = ServiceResponse.success("Bike inventory retrieved successfully", inventory);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      console.error("Error getting bike inventory:", error);
      const serviceResponse = ServiceResponse.failure("Failed to retrieve bike inventory", null, 500);
      return handleServiceResponse(serviceResponse, res);
    }
  };
}

export const dataExportController = new DataExportController();
