import type { Request, RequestHandler, Response } from "express";

import { transactionsService } from "@/api/transactions/transactionsService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { useFunc } from "ajv/dist/compile/util";

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
}

export const transactionsController = new TransactionsController();
