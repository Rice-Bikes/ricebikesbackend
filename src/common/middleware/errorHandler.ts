import { env } from "@/common/utils/envConfig";
import { middlewareLogger as logger } from "@/common/utils/logger";
import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * Handles requests to undefined routes by returning 404 Not Found
 */
const unexpectedRequest: RequestHandler = (req, res) => {
  logger.warn(
    {
      path: req.path,
      method: req.method,
    },
    "Route not found",
  );

  res.status(StatusCodes.NOT_FOUND).json({
    status: "error",
    message: "The requested resource does not exist",
  });
};

/**
 * Adds error to response locals for logging middleware
 */
const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err;
  next(err);
};

/**
 * Global error handler for all unhandled errors in the application
 */
const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  // Extract user info safely if it exists
  const userId = (req as any).user?.id;

  // Log the error with appropriate level
  if (status >= StatusCodes.INTERNAL_SERVER_ERROR) {
    logger.error(
      {
        err,
        path: req.path,
        method: req.method,
        userId,
      },
      `Server error: ${err.message}`,
    );
  } else {
    logger.warn(
      {
        err,
        path: req.path,
        method: req.method,
        userId,
      },
      `Client error: ${err.message}`,
    );
  }

  // Send appropriate response
  const response = {
    status: "error",
    message:
      status >= StatusCodes.INTERNAL_SERVER_ERROR
        ? "An unexpected error occurred"
        : err.message || "Something went wrong",
  };

  // Include stack trace in development
  if (!env.isProduction) {
    (response as any).stack = err.stack;
    (response as any).details = err.details || (err as any).data || undefined;
  }

  res.status(status).json(response);
};

/**
 * Returns an array of error handling middleware
 */
export default () => [
  unexpectedRequest, // Handle undefined routes
  addErrorToRequestLog, // Add error to res.locals for logging
  globalErrorHandler, // Handle all other errors
];
