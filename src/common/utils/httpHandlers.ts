import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { pinoHttp } from "pino-http";
import type { ZodError, ZodSchema } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serverLogger } from "./logger";

export const handleServiceResponse = (serviceResponse: ServiceResponse<any>, response: Response) => {
  return response.status(serviceResponse.statusCode).send(serviceResponse);
};

/**
 * Middleware to validate the request using a Zod schema.
 *
 * @param schema - The Zod schema to validate the request against.
 * @returns A middleware function that validates the request and calls the next middleware if valid,
 *          or sends an error response if invalid.
 *
 * @throws {ZodError} If the request validation fails.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateRequest } from './path/to/httpHandlers';
 *
 * const schema = z.object({
 *   body: z.object({
 *     name: z.string(),
 *   }),
 * });
 *
 * app.post('/endpoint', validateRequest(schema), (req, res) => {
 *   res.send('Request is valid');
 * });
 * ```
 */
export const validateRequest = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  // console.log(req.body, req.query, req.params);
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (err) {
    serverLogger.error(err);
    const errorMessage = `Invalid input: ${(err as ZodError).errors.map((e) => `${e.message} ${e.code}`).join(", ")}`;
    const statusCode = StatusCodes.BAD_REQUEST;
    const serviceResponse = ServiceResponse.failure(errorMessage, null, statusCode);
    return handleServiceResponse(serviceResponse, res);
  }
};
