import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderRequestsService } from "@/api/transactionComponents/orderRequests/orderRequestService";

function makeRepo() {
  return {
    findAllAsync: vi.fn(),
    findByIdAgg: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    extractText: vi.fn(),
  };
}

describe("OrderRequestsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("findAll returns 404 when repository returns no items", async () => {
    const repo = makeRepo();
    repo.findAllAsync.mockResolvedValue([]);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAll returns items when repository returns results", async () => {
    const repo = makeRepo();
    const items = [{ id: "or1" }];
    repo.findAllAsync.mockResolvedValue(items);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(items);
  });

  it("findAll returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.findAllAsync.mockRejectedValue(new Error("db error"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findAll();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("findById returns 404 when not found", async () => {
    const repo = makeRepo();
    repo.findByIdAgg.mockResolvedValue(null);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findById("missing-id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findById returns data when found", async () => {
    const repo = makeRepo();
    const agg = [{ order_request_id: "r1" }];
    repo.findByIdAgg.mockResolvedValue(agg);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findById("r1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(agg);
  });

  it("findById returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.findByIdAgg.mockRejectedValue(new Error("fail"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.findById("r2");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("createOrderRequest returns created object on success", async () => {
    const repo = makeRepo();
    const created = { id: "new" };
    repo.create.mockResolvedValue(created);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.createOrderRequest({} as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(created);
  });

  it("createOrderRequest returns 500 on error", async () => {
    const repo = makeRepo();
    repo.create.mockRejectedValue(new Error("create fail"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.createOrderRequest({} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("updateOrderRequest returns updated object on success", async () => {
    const repo = makeRepo();
    const updated = { id: "u1", note: "ok" };
    repo.update.mockResolvedValue(updated);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.updateOrderRequest({} as any);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(updated);
  });

  it("updateOrderRequest returns 500 on error", async () => {
    const repo = makeRepo();
    repo.update.mockRejectedValue(new Error("update fail"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.updateOrderRequest({} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("deleteOrderRequest returns deleted object on success", async () => {
    const repo = makeRepo();
    const deleted = { id: "d1" };
    repo.delete.mockResolvedValue(deleted);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.deleteOrderRequest("d1");
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(deleted);
  });

  it("deleteOrderRequest returns 500 on error", async () => {
    const repo = makeRepo();
    repo.delete.mockRejectedValue(new Error("delete fail"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.deleteOrderRequest("d1");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("extractText returns extracted text array on success", async () => {
    const repo = makeRepo();
    const text = ["line1", "line2"];
    repo.extractText.mockResolvedValue(text);
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.extractText(Buffer.from("dummy"));
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(text);
  });

  it("extractText returns 500 on error", async () => {
    const repo = makeRepo();
    repo.extractText.mockRejectedValue(new Error("parse fail"));
    const svc = new OrderRequestsService(repo as any);

    const res = await svc.extractText(Buffer.from("dummy"));
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
