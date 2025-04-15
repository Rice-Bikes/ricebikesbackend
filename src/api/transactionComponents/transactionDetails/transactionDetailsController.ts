import type { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Request, RequestHandler, Response } from "express";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import { Validator } from "../../validator/validator";
import { transactionDetailsService } from "../transactionDetails/transactionDetailsService";
import type { TransactionDetailsWithForeignKeys } from "./transactionDetailsModel";

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
  public getAllTransactionDetails: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await transactionDetailsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    const detailType = req.query.detailType;
    let serviceResponse: ServiceResponse<TransactionDetailsWithForeignKeys[] | null>;

    if (detailType === "repair") {
      serviceResponse = await transactionDetailsService.findRepairs(req.params.transaction_id);
    } else if (detailType === "item") {
      serviceResponse = await transactionDetailsService.findItems(req.params.transaction_id);
    } else {
      serviceResponse = await transactionDetailsService.findAllById(req.params.transaction_id);
    }

    // const serviceResponse = await transactionDetailsService.findAllById(req.params.id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    const transaction_id = req.params.transaction_id;
    console.log("id for create transaction", transaction_id);
    // if (!this.isTransactionDetailRequest(req.body)) {
    //   return res.status(400).send("Invalid request body");
    // }
    const body = req.body;

    let serviceResponse: any;
    if (!body.item_id && body.repair_id) {
      serviceResponse = await transactionDetailsService.createTransactionDetail(
        transaction_id,
        body.changed_by,
        body.quantity,
        undefined,
        body.repair_id,
      );
    } else if (body.item_id) {
      serviceResponse = await transactionDetailsService.createTransactionDetail(
        transaction_id,
        body.changed_by,
        body.quantity,
        body.item_id.trim(),
        undefined,
      );
    } else {
      return res.status(400).send("Invalid request body, either item_id or repair_id must be provided");
    }
    return handleServiceResponse(serviceResponse, res);
  };

  public updateTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await transactionDetailsService.updateById(
      req.params.transaction_detail_id,
      req.body.completed,
    );
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteTransactionDetails: RequestHandler = async (req: Request, res: Response) => {
    console.log("deleting transaction details", req.params.transaction_detail_id);
    const serviceResponse = await transactionDetailsService.deleteById(req.params.transaction_detail_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionDetailsController = new TransactionDetailsController();
