import { StatusCodes } from "http-status-codes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { transactionLogService } from "@/api/transactionComponents/transactionLogs/transactionLogsService";
import { TransactionsService } from "@/api/transactionComponents/transactions/transactionsService";
import { ServiceResponse } from "@/common/models/serviceResponse";
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

  it("findAll returns an empty list, not a 404, when nothing matches", async () => {
    const repo = makeRepo();
    repo.findAll.mockResolvedValue({ transactions: [], next_cursor: null, total: 0 });
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll({ page_limit: 10 });
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(StatusCodes.OK);
    expect(res.responseObject).toEqual([]);
    expect(res.next_cursor).toBeNull();
    expect(res.total).toBe(0);
  });

  it("findAll returns transactions when present", async () => {
    const repo = makeRepo();
    const txs = [{ id: "t1" }];
    repo.findAll.mockResolvedValue({ transactions: txs, next_cursor: "cursor-1", total: 57 });
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll({ page_limit: 10 });
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(txs);
    expect(res.next_cursor).toBe("cursor-1");
    // total counts every match, not just the rows on this page.
    expect(res.total).toBe(57);
  });

  it("findAll returns 500 on repository error", async () => {
    const repo = makeRepo();
    repo.findAll.mockRejectedValue(new Error("db down"));
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAll({ page_limit: 10 });
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  it("findAllAgg returns an empty list, not a 404, when nothing matches", async () => {
    const repo = makeRepo();
    repo.findAllAggregate.mockResolvedValue({ transactions: [], next_cursor: null, total: 0 });
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAllAgg({ page_limit: 10 });
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(StatusCodes.OK);
    expect(res.responseObject).toEqual([]);
  });

  it("findAllAgg returns data when present", async () => {
    const repo = makeRepo();
    const agg = [{ id: "agg1" }];
    repo.findAllAggregate.mockResolvedValue({ transactions: agg, next_cursor: null, total: 1 });
    const svc = new TransactionsService(repo as any);
    const res = await svc.findAllAgg({ page_limit: 10 });
    expect(res.success).toBe(true);
    expect(res.responseObject).toEqual(agg);
    expect(res.next_cursor).toBeNull();
    expect(res.total).toBe(1);
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
      transaction_type: "retrospec",
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

  describe("automatic history", () => {
    /** Stubs the log service and hands back the spy on its create call. */
    function stubLogService() {
      return vi
        .spyOn(transactionLogService, "createTransactionLog")
        .mockResolvedValue(ServiceResponse.success("logged", {} as any));
    }

    it("logs every field an update changed, attributed to changed_by", async () => {
      const repo = makeRepo();
      repo.findByIdAggregate.mockResolvedValue({ transaction_type: "inpatient", total_cost: 0, is_paid: false });
      repo.updateById.mockResolvedValue({
        transaction_num: 17429,
        transaction_id: "tx-1",
        transaction_type: "inpatient",
        total_cost: 19.5,
        is_paid: false,
      });
      const logSpy = stubLogService();
      vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);

      const svc = new TransactionsService(repo as any);
      const res = await svc.updateTransactionByID("tx-1", {} as any, "user-1");

      expect(res.success).toBe(true);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(17429, "user-1", "changed the total cost to $19.50", "updated");
    });

    it("writes one entry per change when an update changes several fields", async () => {
      const repo = makeRepo();
      repo.findByIdAggregate.mockResolvedValue({
        transaction_type: "inpatient",
        total_cost: 0,
        is_completed: false,
        is_paid: false,
      });
      repo.updateById.mockResolvedValue({
        transaction_num: 17429,
        transaction_id: "tx-1",
        transaction_type: "inpatient",
        total_cost: 19.5,
        is_completed: true,
        is_paid: true,
      });
      const logSpy = stubLogService();
      vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);

      const svc = new TransactionsService(repo as any);
      await svc.updateTransactionByID("tx-1", {} as any, "user-1");

      expect(logSpy.mock.calls.map((call) => [call[2], call[3]])).toEqual([
        ["changed the total cost to $19.50", "updated"],
        ["completed the transaction", "completed"],
        ["checked out the transaction for $19.50", "checkout"],
      ]);
    });

    it("writes no history when an update changed nothing", async () => {
      const repo = makeRepo();
      const unchanged = {
        transaction_num: 17429,
        transaction_id: "tx-1",
        transaction_type: "inpatient",
        is_paid: false,
      };
      repo.findByIdAggregate.mockResolvedValue(unchanged);
      repo.updateById.mockResolvedValue(unchanged);
      const logSpy = stubLogService();
      vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);

      const svc = new TransactionsService(repo as any);
      await svc.updateTransactionByID("tx-1", {} as any, "user-1");

      expect(logSpy).not.toHaveBeenCalled();
    });

    it("still reports the update as successful when writing history fails", async () => {
      // The row is already committed by then, so a failed log must not turn a
      // change that did happen into an error for the client.
      const repo = makeRepo();
      repo.findByIdAggregate.mockResolvedValue({ transaction_type: "inpatient", total_cost: 0, is_paid: false });
      repo.updateById.mockResolvedValue({
        transaction_num: 17429,
        transaction_id: "tx-1",
        transaction_type: "inpatient",
        total_cost: 19.5,
        is_paid: false,
      });
      vi.spyOn(transactionLogService, "createTransactionLog").mockRejectedValue(new Error("logs table down"));
      vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);

      const svc = new TransactionsService(repo as any);
      const res = await svc.updateTransactionByID("tx-1", {} as any, "user-1");

      expect(res.success).toBe(true);
      expect(res.responseObject).toMatchObject({ transaction_num: 17429 });
    });

    it("logs the creation of a transaction", async () => {
      const repo = makeRepo();
      repo.createTransaction.mockResolvedValue({
        transaction_num: 17430,
        transaction_id: "tx-2",
        transaction_type: "retrospec",
      });
      const logSpy = stubLogService();

      const svc = new TransactionsService(repo as any);
      const res = await svc.createTransaction({ transaction_type: "retrospec" } as any, "user-1");

      expect(res.success).toBe(true);
      expect(logSpy).toHaveBeenCalledWith(17430, "user-1", "created a new retrospec transaction", "created");
    });

    it("logs each copy when a transaction is created with a quantity", async () => {
      const repo = makeRepo();
      repo.createTransaction
        .mockResolvedValueOnce({ transaction_num: 1, transaction_id: "a", transaction_type: "Retrospec" })
        .mockResolvedValueOnce({ transaction_num: 2, transaction_id: "b", transaction_type: "Retrospec" });
      const logSpy = stubLogService();

      const svc = new TransactionsService(repo as any);
      await svc.createTransaction({ transaction_type: "retrospec" } as any, "user-1", undefined, undefined, 2);

      expect(logSpy.mock.calls.map((call) => call[0])).toEqual([1, 2]);
    });

    it("skips history rather than failing when an internal caller omits changed_by", async () => {
      const repo = makeRepo();
      repo.findByIdAggregate.mockResolvedValue({ transaction_type: "inpatient", total_cost: 0, is_paid: false });
      repo.updateById.mockResolvedValue({
        transaction_num: 17429,
        transaction_id: "tx-1",
        transaction_type: "inpatient",
        total_cost: 19.5,
        is_paid: false,
      });
      const logSpy = stubLogService();
      vi.spyOn(transactionHelpers, "getTransactionWithDetails").mockResolvedValue({} as any);

      const svc = new TransactionsService(repo as any);
      const res = await svc.updateTransactionByID("tx-1", {} as any);

      expect(res.success).toBe(true);
      expect(logSpy).not.toHaveBeenCalled();
    });
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
