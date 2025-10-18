import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { middlewareLogger as logger } from "@/common/utils/logger";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import type { LevelWithSilent } from "pino";
import { type CustomAttributeKeys, type Options, pinoHttp } from "pino-http";

import { env } from "@/common/utils/envConfig";

enum LogLevel {
  Fatal = "fatal",
  Error = "error",
  Warn = "warn",
  Info = "info",
  Debug = "debug",
  Trace = "trace",
  Silent = "silent",
}

type PinoCustomProps = {
  request: Request;
  response: Response;
  error: Error;
  responseBody: unknown;
};

const requestLogger = (options?: Options): RequestHandler[] => {
  logger.debug("Initializing request logger middleware");
  const pinoOptions: Options = {
    enabled: env.isProduction,
    customProps: customProps as unknown as Options["customProps"],
    redact: ["request.headers.authorization", "request.headers.cookie"],
    genReqId,
    customLogLevel,
    customSuccessMessage,
    customReceivedMessage: (req) => `request received: ${req.method}`,
    customErrorMessage: (_req, res) => `request errored with status code: ${res.statusCode}`,
    customAttributeKeys,
    logger: logger,
    ...options,
  };
  return [responseBodyMiddleware, pinoHttp(pinoOptions)];
};

const customAttributeKeys: CustomAttributeKeys = {
  req: "request",
  res: "response",
  err: "error",
  responseTime: "timeTaken",
};

const customProps = (req: Request, res: Response): PinoCustomProps => ({
  request: req,
  response: res,
  error: res.locals.err,
  responseBody: res.locals.responseBody,
});

const responseBodyMiddleware: RequestHandler = (_req, res, next) => {
  const isNotProduction = !env.isProduction;
  if (isNotProduction) {
    const originalSend = res.send;
    res.send = (content) => {
      try {
        // Safely handle different content types
        if (content) {
          const contentType = res.get("Content-Type") || "";
          const isJSON = contentType.includes("application/json");
          const isText = contentType.includes("text/") || isJSON;

          if (isText) {
            const strContent = content.toString();
            const sizeInBytes = Buffer.byteLength(strContent);
            logger.debug({ responseSize: sizeInBytes, contentType }, "Response body captured");

            // Only store response body in dev mode and if it's not too large
            if (sizeInBytes < 10000) {
              // Don't store bodies larger than ~10KB
              res.locals.responseBody = content;
            } else {
              res.locals.responseBody = `[Large response: ${sizeInBytes} bytes]`;
            }
          } else {
            // For binary responses, just log the type and size
            logger.debug(
              {
                contentType,
                responseSize: Buffer.isBuffer(content) ? content.length : "unknown",
              },
              "Binary response body captured",
            );
            res.locals.responseBody = "[Binary content]";
          }
        }
      } catch (err) {
        const error = err as Error;
        logger.debug({ err: error.message }, "Error capturing response body");
        res.locals.responseBody = "[Error capturing response]";
      }

      res.send = originalSend;
      return originalSend.call(res, content);
    };
  }
  next();
};

const customLogLevel = (_req: IncomingMessage, res: ServerResponse<IncomingMessage>, err?: Error): LevelWithSilent => {
  if (err || res.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) return LogLevel.Error;
  if (res.statusCode >= StatusCodes.BAD_REQUEST) return LogLevel.Warn;
  if (res.statusCode >= StatusCodes.MULTIPLE_CHOICES) return LogLevel.Silent;
  return LogLevel.Info;
};

const customSuccessMessage = (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
  if (res.statusCode === StatusCodes.NOT_FOUND) return getReasonPhrase(StatusCodes.NOT_FOUND);
  return `${req.method} completed`;
};

const genReqId = (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
  const existingID = req.id ?? req.headers["x-request-id"];
  if (existingID) return existingID;
  const id = randomUUID();
  res.setHeader("X-Request-Id", id);
  return id;
};

logger.info("Request logger middleware configured");
export default requestLogger();
