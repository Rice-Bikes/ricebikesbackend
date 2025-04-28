import type { Request, RequestHandler, Response } from "express";

import type { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { AggTransaction, Transaction, UpdateTransaction } from "../transactions/transactionModel";
import { transactionsService } from "../transactions/transactionsService";

class TransactionsController {
  public getTransactions: RequestHandler = async (_req: Request, res: Response) => {
    let after_id: number;
    if (!_req.query.after_id) {
      after_id = 2147483647;
    } else {
      after_id = Number.parseInt(_req.query.after_id as string, 10);
    }
    if (!_req.query.page_limit) {
      return res.status(400).send("Invalid url params, requires page limit and cursor");
    }
    const page_limit = Number.parseInt(_req.query.page_limit as string, 10);

    let serviceResponse: ServiceResponse<Transaction[] | AggTransaction[] | null>;
    if (_req.query.aggregate) {
      serviceResponse = await transactionsService.findAllAgg(after_id, page_limit);
    } else {
      serviceResponse = await transactionsService.findAll(after_id, page_limit);
    }
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransaction: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await transactionsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransaction: RequestHandler = async (req: Request, res: Response) => {
    const newTransaction = {
      ...req.body,
      date_created: new Date(),
      total_cost: 0,
      description: "",
      is_completed: false,
      is_paid: false,
      is_refurb: false,
      is_urgent: false,
      is_nuclear: false,
      is_beer_bike: false,
      is_reserved: false,
      is_waiting_on_email: false,
    } as Transaction;
    const serviceResponse = await transactionsService.createTransaction(newTransaction);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateTransaction: RequestHandler = async (req: Request, res: Response) => {
    // console.log("pinging update transaction", req.body.description);
    const serviceResponse = await transactionsService.updateTransactionByID(
      req.params.transaction_id,
      req.body as UpdateTransaction,
    );
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteTransaction: RequestHandler = async (req: Request, res: Response) => {
    // console.log("delete transaction  params", req.params);
    const serviceResponse = await transactionsService.deleteTransactionByID(req.params.transaction_id);
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransactionsSummary: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await transactionsService.getTransactionsSummary();
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionsController = new TransactionsController();
