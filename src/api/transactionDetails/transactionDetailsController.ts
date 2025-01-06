import { transactionDetailsService } from "@/api/transactionDetails/transactionDetailsService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Request, RequestHandler, Response } from "express";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import { Validator } from "../validator/validator";

const transactionDetailRequestSchema = {
  $id: "transactionDetail.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "transactionDetail",
  type: "object",
  // if item is added
  properties: {
    transaction_id: { type: "number" },
    item_id: { type: ["string", "null"] },
    repair_id: { type: ["string", "null"] },
    changed_by: { type: "string" },
    quantity: { type: "number" },
  },
  required: ["transaction_id", "changed_by", "quantity"],
} as const satisfies JSONSchema;

export type TransactionDetailRequest = FromSchema<typeof transactionDetailRequestSchema>;

class TransactionDetailsController {
  // private validator: tdValidator;
  private isTransactionDetailRequest!: (data: unknown) => data is TransactionDetailRequest;

  public TransactionDetailsController() {
    const validator = new Validator();
    this.isTransactionDetailRequest = validator.compile(transactionDetailRequestSchema);
  }

  public getAllTransactionDetails: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await transactionDetailsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await transactionDetailsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    if (!this.isTransactionDetailRequest(req.body)) {
      return res.status(400).send("Invalid request body");
    }
    const body = req.body;

    let serviceResponse: any;
    if (!body.item_id && body.repair_id) {
      serviceResponse = await transactionDetailsService.createTransactionDetail(
        body.transaction_id,
        body.changed_by,
        body.quantity,
        body.repair_id,
      );
    } else if (body.item_id) {
      serviceResponse = await transactionDetailsService.createTransactionDetail(
        body.transaction_id,
        body.changed_by,
        body.quantity,
        body.item_id,
      );
    } else {
      return res.status(400).send("Invalid request body, either item_id or repair_id must be provided");
    }
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionDetailsController = new TransactionDetailsController();
