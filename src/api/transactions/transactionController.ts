import type { Request, RequestHandler, Response } from "express";

import { transactionsService } from "@/api/transactions/transactionsService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class TransactionsController {
  public getTransactions: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await transactionsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransaction: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await transactionsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionsController = new TransactionsController();
