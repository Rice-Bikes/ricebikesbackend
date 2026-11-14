import { StatusCodes } from "http-status-codes";
import { z } from "zod";

/** Pagination fields a listing can attach to its response. */
export interface PaginationMeta {
  /**
   * The cursor to pass back to fetch the following page, or null when the
   * current page is the last one.
   */
  next_cursor?: string | null;
  /**
   * Total number of records matching the request's filters, across every
   * page. Independent of the cursor and of page_limit.
   */
  total?: number;
}

export class ServiceResponse<T = null> {
  readonly success: boolean;
  readonly message: string;
  readonly responseObject: T;
  readonly statusCode: number;
  /** See {@link PaginationMeta}. Absent on responses that are not paginated. */
  readonly next_cursor?: string | null;
  /** See {@link PaginationMeta}. Absent on responses that are not paginated. */
  readonly total?: number;

  private constructor(
    success: boolean,
    message: string,
    responseObject: T,
    statusCode: number,
    pagination?: PaginationMeta,
  ) {
    this.success = success;
    this.message = message;
    this.responseObject = responseObject;
    this.statusCode = statusCode;
    if (pagination?.next_cursor !== undefined) {
      this.next_cursor = pagination.next_cursor;
    }
    if (pagination?.total !== undefined) {
      this.total = pagination.total;
    }
  }

  static success<T>(
    message: string,
    responseObject: T,
    statusCode: number = StatusCodes.OK,
    pagination?: PaginationMeta,
  ) {
    return new ServiceResponse(true, message, responseObject, statusCode, pagination);
  }

  static failure<T>(message: string, responseObject: T, statusCode: number = StatusCodes.BAD_REQUEST) {
    return new ServiceResponse(false, message, responseObject, statusCode);
  }
}

export const ServiceResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    responseObject: dataSchema.optional(),
    statusCode: z.number(),
    next_cursor: z.string().nullable().optional(),
    total: z.number().int().optional(),
  });
