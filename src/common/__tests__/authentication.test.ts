import { authenticateAdmin } from "@/common/middleware/authentication";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("authenticateAdmin middleware", () => {
  it("calls next when user is admin", () => {
    const req = { body: { user: { isAdmin: true } } } as any;
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnValue({ json: vi.fn() }),
    } as any;

    authenticateAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 and an error message when user is not admin", () => {
    const req = { body: { user: { isAdmin: false } } } as any;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as any;
    const next = vi.fn();

    authenticateAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user is missing", () => {
    const req = { body: {} } as any;
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res = { status } as any;
    const next = vi.fn();

    authenticateAdmin(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: "Admin access required" });
    expect(next).not.toHaveBeenCalled();
  });
});
