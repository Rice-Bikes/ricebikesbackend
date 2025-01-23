import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Request, RequestHandler, Response } from "express";
import { summaryService } from "./summaryService";

class SummaryController {
  public getTransactionsSummary: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await summaryService.getTransactionsSummary();
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionsController = new SummaryController();
