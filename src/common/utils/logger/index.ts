/**
 * Logger Module for Rice Bikes Backend
 *
 * This module provides logging capabilities throughout the application.
 * It uses Pino for logging and provides specialized loggers for different components.
 */

import { env } from "@/common/utils/envConfig";
import { pino } from "pino";

// Determine log level based on NODE_ENV
const LOG_LEVEL = process.env.LOG_LEVEL || (env.isDev ? "debug" : "info");

// Create base logger instance
const baseLogger = pino({
  level: LOG_LEVEL,
  transport: env.isDev ? { target: "pino-pretty", options: { colorize: true } } : undefined,
});

// Root logger - use this sparingly
export const logger = baseLogger;

/**
 * Create a specialized logger for a specific component
 * @param name Component name for the logger
 * @returns A child logger with the component name
 */
export const createLogger = (name: string) => {
  return logger.child({ name });
};

// Pre-configured loggers for common components
export const serverLogger = createLogger("server");
export const repositoryLogger = createLogger("repository");
export const serviceLogger = createLogger("service");
export const controllerLogger = createLogger("controller");
export const middlewareLogger = createLogger("middleware");
export const dbLogger = createLogger("database");

/**
 * Get a logger for a specific class
 * This is useful for class-based components
 *
 * @param className The name of the class
 * @returns A child logger with the class name
 *
 * @example
 * // In a class file:
 * private logger = getClassLogger(MyClass.name);
 */
export const getClassLogger = (className: string) => {
  return createLogger(`class:${className}`);
};
