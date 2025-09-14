// Prisma Middleware for Backend - Convert all Decimal fields to numbers
// This should be added to your backend Prisma client setup

import { Prisma } from "@prisma/client";

/**
 * Recursively converts Prisma Decimal objects to numbers
 * @param obj - The object to process
 * @returns The object with Decimal values converted to numbers
 */
function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Prisma Decimal objects
  if (obj instanceof Prisma.Decimal) {
    return obj.toNumber();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertDecimalsToNumbers);
  }

  // Handle plain objects
  if (typeof obj === "object" && obj.constructor === Object) {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertDecimalsToNumbers(value);
    }
    return converted;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Prisma middleware that automatically converts all Decimal fields to numbers
 * Add this to your Prisma client setup in your backend:
 *
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { decimalToNumberMiddleware } from './utils/prismaDecimalMiddleware';
 *
 * const prisma = new PrismaClient();
 * prisma.$use(decimalToNumberMiddleware);
 * ```
 */
export const decimalToNumberMiddleware: Prisma.Middleware = async (params, next) => {
  const result = await next(params);

  // Only process results from queries that return data
  if (
    params.action === "findMany" ||
    params.action === "findUnique" ||
    params.action === "findFirst" ||
    params.action === "findUniqueOrThrow" ||
    params.action === "findFirstOrThrow" ||
    params.action === "create" ||
    params.action === "update" ||
    params.action === "upsert"
  ) {
    return convertDecimalsToNumbers(result);
  }

  return result;
};

// Alternative: More targeted middleware that only converts specific models
export const createModelSpecificDecimalMiddleware = (modelsToConvert: string[]) => {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    const result = await next(params);

    // Only convert decimals for specified models
    if (modelsToConvert.includes(params.model || "")) {
      return convertDecimalsToNumbers(result);
    }

    return result;
  };
};

// Example usage for specific models:
// export const bikeDecimalMiddleware = createModelSpecificDecimalMiddleware(['Bikes', 'Transactions']);
