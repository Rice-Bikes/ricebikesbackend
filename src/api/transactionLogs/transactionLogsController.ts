import type { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Request, RequestHandler, Response } from "express";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import type { TransactionLogWithForeignKeys } from "./transactionLogsModel";
import { transactionLogService } from "./transactionLogsService";

const transactionLogRequestSchema = {
  $id: "transactionLog.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "transactionLog",
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

export type TransactionLogRequest = FromSchema<typeof transactionLogRequestSchema>;

class TransactionLogsController {
  public getAllTransactionLogs: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await transactionLogService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getTransactionLogs: RequestHandler = async (req: Request, res: Response) => {
    const transactionNum = Number.parseInt(req.params.transaction_num);
    const serviceResponse: ServiceResponse<TransactionLogWithForeignKeys[] | null> =
      await transactionLogService.findAllById(transactionNum);

    // const serviceResponse = await transactionLogsService.findAllById(req.params.id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTransactionLogs: RequestHandler = async (req: Request, res: Response) => {
    const transaction_id = Number.parseInt(req.params.transaction_id);
    console.log("id for create transaction", transaction_id);
    // if (!this.isTransactionLogRequest(req.body)) {
    //   return res.status(400).send("Invalid request body");
    // }
    const body = req.body;

    const serviceResponse = await transactionLogService.createTransactionLog(
      transaction_id,
      body.changed_by,
      body.description,
      body.change_type,
    );
    return handleServiceResponse(serviceResponse, res);
  };
}

export const transactionLogsController = new TransactionLogsController();
