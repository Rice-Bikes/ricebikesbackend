import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { handleServiceResponse, validateRequest } from "@/common/utils/httpHandlers";
import { serverLogger } from "@/common/utils/logger";

describe("http handlers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handleServiceResponse sets status and sends the service response", () => {
    const res: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    const sr = ServiceResponse.success("ok", { foo: "bar" }, StatusCodes.CREATED);

    // call the helper
    handleServiceResponse(sr, res);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    expect(res.send).toHaveBeenCalledWith(sr);
  });

  it("validateRequest calls next() for valid input", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    const req: any = {
      body: { name: "Alice" },
      query: {},
      params: {},
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const next = vi.fn();

    const middleware = validateRequest(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("validateRequest returns a failure response when validation fails", () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    });

    const req: any = {
      body: {}, // missing name
      query: {},
      params: {},
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    const next = vi.fn();

    const middleware = validateRequest(schema);

    // Spy on serverLogger to avoid noisy logs in test output
    const loggerSpy = vi.spyOn(serverLogger, "error").mockImplementation(() => {});

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.send).toHaveBeenCalled();

    const sent = res.send.mock.calls[0][0];
    expect(sent).toHaveProperty("success", false);
    expect(sent).toHaveProperty("statusCode", StatusCodes.BAD_REQUEST);
    expect(typeof sent.message).toBe("string");
    expect(sent.message).toContain("Invalid input:");
    expect(loggerSpy).toHaveBeenCalled();
  });
});
