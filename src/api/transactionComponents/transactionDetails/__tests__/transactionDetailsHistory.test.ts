import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransactionDetailsService } from "@/api/transactionComponents/transactionDetails/transactionDetailsService";
import { transactionHistoryService } from "@/services/transactionHistoryService";

function makeRepo() {
  return {
    findAllAsync: vi.fn(),
    findAllTransactionDetails: vi.fn(),
    findAllItems: vi.fn(),
    findAllRepairs: vi.fn(),
    findHistoryContext: vi.fn(),
    createAsync: vi.fn(),
    updateStatus: vi.fn(),
    deleteAsync: vi.fn(),
  };
}

/** Stubs both history writers and returns the spies on them. */
function stubHistory() {
  return {
    record: vi.spyOn(transactionHistoryService, "record").mockResolvedValue(),
    recordByTransactionId: vi.spyOn(transactionHistoryService, "recordByTransactionId").mockResolvedValue(),
  };
}

describe("transaction detail history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a part being added, against the transaction it was added to", async () => {
    const repo = makeRepo();
    repo.createAsync.mockResolvedValue({
      transaction_detail_id: "d1",
      transaction_id: "tx-1",
      quantity: 1,
      Item: { name: "Teravail Standard Tube" },
    });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    const res = await svc.createTransactionDetail("tx-1", "user-1", 1, "item-1");

    expect(res.success).toBe(true);
    expect(history.recordByTransactionId).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "part", description: 'added the part "Teravail Standard Tube"' },
    ]);
  });

  it("logs a repair being added", async () => {
    const repo = makeRepo();
    repo.createAsync.mockResolvedValue({
      transaction_detail_id: "d1",
      transaction_id: "tx-1",
      quantity: 1,
      Repair: { name: "Flat repair" },
    });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    await svc.createTransactionDetail("tx-1", "user-1", 1, undefined, "repair-1");

    expect(history.recordByTransactionId).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "repair", description: 'added the repair "Flat repair"' },
    ]);
  });

  it("logs a repair being completed, against the resolved transaction number", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue({
      transaction_num: 17429,
      item_name: null,
      repair_name: "Flat repair",
      tune_up_name: null,
      quantity: 1,
      completed: false,
    });
    repo.updateStatus.mockResolvedValue({ transaction_detail_id: "d1", completed: true });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    const res = await svc.updateById("d1", true, "user-1");

    expect(res.success).toBe(true);
    expect(history.record).toHaveBeenCalledWith(17429, "user-1", [
      { change_type: "repair", description: 'completed the repair "Flat repair"' },
    ]);
  });

  it("logs a tune up's repair with the tune up named", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue({
      transaction_num: 17429,
      item_name: null,
      repair_name: "Brake adjustment",
      tune_up_name: "Safety Check",
      quantity: 1,
      completed: true,
    });
    repo.updateStatus.mockResolvedValue({ transaction_detail_id: "d1", completed: false });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    await svc.updateById("d1", false, "user-1");

    expect(history.record).toHaveBeenCalledWith(17429, "user-1", [
      { change_type: "tune up", description: 'uncompleted the repair "Brake adjustment" in the Safety Check tune up' },
    ]);
  });

  it("writes nothing when a repair is checked off twice", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue({
      transaction_num: 17429,
      repair_name: "Flat repair",
      tune_up_name: null,
      item_name: null,
      quantity: 1,
      completed: true,
    });
    repo.updateStatus.mockResolvedValue({ transaction_detail_id: "d1", completed: true });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    await svc.updateById("d1", true, "user-1");

    expect(history.record).not.toHaveBeenCalled();
  });

  it("reads the detail before deleting it, so the removal can still be described", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue({
      transaction_num: 17429,
      item_name: "Teravail Standard Tube",
      repair_name: null,
      tune_up_name: null,
      quantity: 1,
      completed: true,
    });
    repo.deleteAsync.mockResolvedValue({ transaction_detail_id: "d1" });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    const res = await svc.deleteById("d1", "user-1");

    expect(res.success).toBe(true);
    // The lookup has to happen first; afterwards the row is gone.
    expect(repo.findHistoryContext.mock.invocationCallOrder[0]).toBeLessThan(
      repo.deleteAsync.mock.invocationCallOrder[0],
    );
    expect(history.record).toHaveBeenCalledWith(17429, "user-1", [
      { change_type: "part", description: 'removed the part "Teravail Standard Tube"' },
    ]);
  });

  it("logs removing a tune up's repair as a removal from that tune up", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue({
      transaction_num: 17429,
      item_name: null,
      repair_name: "Brake adjustment",
      tune_up_name: "Safety Check",
      quantity: 1,
      completed: false,
    });
    repo.deleteAsync.mockResolvedValue({ transaction_detail_id: "d1" });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    await svc.deleteById("d1", "user-1");

    expect(history.record).toHaveBeenCalledWith(17429, "user-1", [
      { change_type: "tune up", description: 'removed the repair "Brake adjustment" from the Safety Check tune up' },
    ]);
  });

  it("still deletes the detail when its history context cannot be found", async () => {
    const repo = makeRepo();
    repo.findHistoryContext.mockResolvedValue(null);
    repo.deleteAsync.mockResolvedValue({ transaction_detail_id: "d1" });
    const history = stubHistory();

    const svc = new TransactionDetailsService(repo as any);
    const res = await svc.deleteById("d1", "user-1");

    expect(res.success).toBe(true);
    expect(history.record).not.toHaveBeenCalled();
  });
});
