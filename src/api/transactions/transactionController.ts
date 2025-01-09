import type { Request, RequestHandler, Response } from "express";

import type { Transaction } from "@/api/transactions/transactionModel";
import { transactionsService } from "@/api/transactions/transactionsService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class TransactionsController {
  public getTransactions: RequestHandler = async (_req: Request, res: Response) => {
    let after_id: number;
    if (!_req.query.after_id) {
      after_id = 2 ** 32 - 1;
    } else {
      after_id = Number.parseInt(_req.query.after_id as string, 10);
    }
    if (!_req.query.page_limit) {
      return res.status(400).send("Invalid url params, requires page limit and cursor");
    }
    const page_limit = Number.parseInt(_req.query.page_limit as string, 10);

    const serviceResponse = await transactionsService.findAll(after_id, page_limit);
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransaction: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await transactionsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransaction: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await transactionsService.createTransaction(req.body as Transaction);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateTransaction: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await transactionsService.updateTransactionByID(
      req.params.transaction_id,
      req.body as Transaction,
    );
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteTransaction: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await transactionsService.deleteTransactionByID(req.params.transaction_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionsController = new TransactionsController();
