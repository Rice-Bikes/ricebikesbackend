import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderRequestsService } from "@/api/transactionComponents/orderRequests/orderRequestService";
import { transactionHistoryService } from "@/services/transactionHistoryService";

function makeRepo() {
  return {
    findAllAsync: vi.fn(),
    findByIdAgg: vi.fn(),
    findAggById: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
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

describe("order request history", () => {
  /** Stubs the history writer used for anything keyed by transaction uuid. */
  function stubHistory() {
    return vi.spyOn(transactionHistoryService, "recordByTransactionId").mockResolvedValue();
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a part being put on order against its transaction", async () => {
    const repo = makeRepo();
    repo.create.mockResolvedValue({
      order_request_id: "o1",
      transaction_id: "tx-1",
      created_by: "user-1",
      quantity: 1,
      ordered: false,
      Item: { name: "Shimano Deore Chain" },
    });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    const res = await svc.createOrderRequest({} as any);

    expect(res.success).toBe(true);
    expect(history).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "order", description: 'requested an order for the part "Shimano Deore Chain"' },
    ]);
  });

  it("logs an order being confirmed", async () => {
    const repo = makeRepo();
    repo.findAggById.mockResolvedValue({ ordered: false });
    repo.patch.mockResolvedValue({
      order_request_id: "o1",
      transaction_id: "tx-1",
      ordered: true,
      Item: { name: "Shimano Deore Chain" },
    });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    const res = await svc.patchOrderRequest("o1", { ordered: true, changed_by: "user-1" } as any);

    expect(res.success).toBe(true);
    expect(history).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "order", description: 'confirmed the order for the part "Shimano Deore Chain"' },
    ]);
  });

  it("keeps changed_by out of the fields written to the order request", async () => {
    const repo = makeRepo();
    repo.findAggById.mockResolvedValue({ ordered: false });
    repo.patch.mockResolvedValue({ transaction_id: "tx-1", ordered: true, Item: { name: "Chain" } });
    stubHistory();

    const svc = new OrderRequestsService(repo as any);
    await svc.patchOrderRequest("o1", { ordered: true, changed_by: "user-1" } as any);

    expect(repo.patch).toHaveBeenCalledWith("o1", { ordered: true });
  });

  it("writes nothing when an order is confirmed twice", async () => {
    const repo = makeRepo();
    repo.findAggById.mockResolvedValue({ ordered: true });
    repo.patch.mockResolvedValue({ transaction_id: "tx-1", ordered: true, Item: { name: "Chain" } });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    await svc.patchOrderRequest("o1", { ordered: true, changed_by: "user-1" } as any);

    expect(history).not.toHaveBeenCalled();
  });

  it("writes nothing for a patch that does not touch the order status", async () => {
    const repo = makeRepo();
    repo.patch.mockResolvedValue({ transaction_id: "tx-1", ordered: false, Item: { name: "Chain" } });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    await svc.patchOrderRequest("o1", { notes: "back order", changed_by: "user-1" } as any);

    expect(history).not.toHaveBeenCalled();
    expect(repo.findAggById).not.toHaveBeenCalled();
  });

  it("reads the order before deleting it, and stays neutral about why", async () => {
    const repo = makeRepo();
    repo.findAggById.mockResolvedValue({ transaction_id: "tx-1", Item: { name: "Shimano Deore Chain" } });
    repo.delete.mockResolvedValue({ order_request_id: "o1" });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    const res = await svc.deleteOrderRequest("o1", "user-1");

    expect(res.success).toBe(true);
    expect(repo.findAggById.mock.invocationCallOrder[0]).toBeLessThan(repo.delete.mock.invocationCallOrder[0]);
    expect(history).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "order", description: 'removed the order for the part "Shimano Deore Chain"' },
    ]);
  });

  it("still deletes the order when it cannot be read first", async () => {
    const repo = makeRepo();
    repo.findAggById.mockRejectedValue(new Error("gone"));
    repo.delete.mockResolvedValue({ order_request_id: "o1" });
    const history = stubHistory();

    const svc = new OrderRequestsService(repo as any);
    const res = await svc.deleteOrderRequest("o1", "user-1");

    expect(res.success).toBe(true);
    expect(history).not.toHaveBeenCalled();
  });
});
