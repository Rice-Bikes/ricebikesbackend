import type { Request, RequestHandler, Response } from "express";

import type { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { InvalidCursorError, type TransactionCursor, decodeCursor } from "../transactions/transactionCursor";
import type { AggTransaction, Transaction, UpdateTransaction } from "../transactions/transactionModel";
import { TRANSACTION_VIEWS, type TransactionView, isTransactionView } from "../transactions/transactionViews";
import { transactionsService } from "../transactions/transactionsService";

class TransactionsController {
  public getTransactions: RequestHandler = async (_req: Request, res: Response) => {
    if (!_req.query.page_limit) {
      return res.status(400).send("Invalid url params, requires page limit");
    }
    const page_limit = Number.parseInt(_req.query.page_limit as string, 10);
    if (!Number.isInteger(page_limit) || page_limit <= 0) {
      return res.status(400).send("page_limit must be a positive integer");
    }

    // The view selects both the filter and the ordering. Omitting it applies
    // no filter at all rather than guessing at one.
    let view: TransactionView | null = null;
    if (_req.query.view !== undefined) {
      if (!isTransactionView(_req.query.view)) {
        return res.status(400).send(`view must be one of: ${TRANSACTION_VIEWS.join(", ")}`);
      }
      view = _req.query.view;
    }

    // Employee transactions are hidden unless explicitly asked for.
    let show_employees = false;
    if (_req.query.show_employees !== undefined) {
      if (_req.query.show_employees !== "true" && _req.query.show_employees !== "false") {
        return res.status(400).send('show_employees must be "true" or "false"');
      }
      show_employees = _req.query.show_employees === "true";
    }

    let cursor: TransactionCursor | null = null;
    if (_req.query.cursor) {
      try {
        cursor = decodeCursor(_req.query.cursor as string, view, show_employees);
      } catch (err) {
        if (err instanceof InvalidCursorError) {
          return res.status(400).send(err.message);
        }
        throw err;
      }
    }

    const options = { page_limit, cursor, view, show_employees };

    let serviceResponse: ServiceResponse<Transaction[] | AggTransaction[] | null>;
    if (_req.query.aggregate) {
      serviceResponse = await transactionsService.findAllAgg(options);
    } else {
      serviceResponse = await transactionsService.findAll(options);
    }
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransaction: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await transactionsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransaction: RequestHandler = async (req: Request, res: Response) => {
    const { step_bundle_id, tune_up_id, quantity, ...body } = req.body;
    const newTransaction = {
      ...body,
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
      is_employee: false,
    } as Transaction;
    const serviceResponse = await transactionsService.createTransaction(
      newTransaction,
      step_bundle_id,
      tune_up_id,
      quantity,
    );
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
