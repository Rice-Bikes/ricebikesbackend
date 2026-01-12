import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionsService } from "@/api/transactionComponents/transactions/transactionsService";
import notificationTriggerService from "@/services/notificationTriggerService";
import * as transactionHelpers from "@/services/transactionHelpers";

function makeRepo() {
  return {
    findAll: vi.fn(),
    findAllAggregate: vi.fn(),
    findByIdAggregate: vi.fn(),
    createTransaction: vi.fn(),
    deleteById: vi.fn(),
    updateById: vi.fn(),
    getTransactionsSummary: vi.fn(),
  };
}

describe("TransactionsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("findAll returns 404 when there are no transactions", async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue([]);
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll(0, 10);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAll returns transactions when present", async () => {
    const repo = makeRepo();
    const txs = [{ id: "t1" }];
    repo.findAll.mockResolvedValue(txs);
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll(0, 10);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(txs);
  });

  it("findAll returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.findAll.mockRejectedValue(new Error("db down"));
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll(0, 10);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("findAllAgg returns 404 when empty", async () => {
    const repo = makeRepo();
    repo.findAllAggregate.mockResolvedValue([]);
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAllAgg(0, 10);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("findAllAgg returns data when present", async () => {
    const repo = makeRepo();
    const agg = [{ id: "agg1" }];
    repo.findAllAggregate.mockResolvedValue(agg);
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAllAgg(0, 10);
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(agg);
  });

  it("findById returns 404 when not found", async () => {
    const repo = makeRepo();
    repo.findByIdAggregate.mockResolvedValue(null);
    const svc = new TransactionsService(repo as any);
    const res = await svc.findById("nope");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("createTransaction returns 404 when creation returns null", async () => {
    const repo = makeRepo();
    repo.createTransaction.mockResolvedValue(null);
    const svc = new TransactionsService(repo as any);
    const res = await svc.createTransaction({} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("deleteTransactionByID returns 404 when not deleted", async () => {
    const repo = makeRepo();
    repo.deleteById.mockResolvedValue(null);
    const svc = new TransactionsService(repo as any);
    const res = await svc.deleteTransactionByID("id");
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateTransactionByID returns 404 when updatedTransaction is null", async () => {
    const repo = makeRepo();
    repo.updateById.mockResolvedValue(null);
    const svc = new TransactionsService(repo as any);
    const res = await svc.updateTransactionByID("id", {} as any);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("updateTransactionByID triggers notification when conditions met", async () => {
    const repo = makeRepo();
    const transaction_id = "tx-1";

    const oldTransaction = {
      transaction_id,
      is_paid: false,
    };
    const updatedTransaction = {
      transaction_id,
      transaction_num: 42,
      transaction_type: "Retrospec",
      is_paid: true,
      total_cost: 100,
      is_completed: false,
      is_reserved: false,
    };

    repo.findByIdAggregate.mockResolvedValue(oldTransaction);
    repo.updateById.mockResolvedValue(updatedTransaction);

    const detailed = {
      bike: { make: "X", model: "Y" },
      customer: { first_name: "A", last_name: "B" },
    };
    vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue(detailed as any);

    const notifySpy = vi.spyOn(notificationTriggerService, "handleBikeSale").mockResolvedValue();

    const svc = new TransactionsService(repo as any);
    const res = await svc.updateTransactionByID(transaction_id, {} as any);

    expect(res.success).toBe(true);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: expect.objectContaining({
          transaction_num: updatedTransaction.transaction_num,
          transaction_id: updatedTransaction.transaction_id,
          total_cost: updatedTransaction.total_cost,
          is_completed: updatedTransaction.is_completed,
          is_reserved: updatedTransaction.is_reserved,
        }),
        bike: detailed.bike,
        customer: detailed.customer,
      }),
    );
  });

  it("updateTransactionByID does not notify when transaction_type isn't retrospec", async () => {
    const repo = makeRepo();
    const transaction_id = "tx-2";

    const oldTransaction = { transaction_id, is_paid: false };
    const updatedTransaction = { transaction_id, transaction_num: 1, transaction_type: "Other", is_paid: true };

    repo.findByIdAggregate.mockResolvedValue(oldTransaction);
    repo.updateById.mockResolvedValue(updatedTransaction);

    vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);
    const notifySpy = vi.spyOn(notificationTriggerService, "handleBikeSale").mockResolvedValue();

    const svc = new TransactionsService(repo as any);
    const res = await svc.updateTransactionByID(transaction_id, {} as any);

    expect(res.success).toBe(true);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it("getTransactionsSummary returns 404 when no summary", async () => {
    const repo = makeRepo();
    repo.getTransactionsSummary.mockResolvedValue(null);
    const svc = new TransactionsService(repo as any);
    const res = await svc.getTransactionsSummary();
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.NOT_FOUND);
  });

  it("getTransactionsSummary returns success when present", async () => {
    const repo = makeRepo();
    const summary = { total: 10 } as any;
    repo.getTransactionsSummary.mockResolvedValue(summary);
    const svc = new TransactionsService(repo as any);
    const res = await svc.getTransactionsSummary();
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(summary);
  });
});
