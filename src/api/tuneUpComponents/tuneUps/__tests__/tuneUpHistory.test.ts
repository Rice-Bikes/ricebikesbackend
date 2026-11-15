import { beforeEach, describe, expect, it, vi } from "vitest";

import { TuneUpService } from "@/api/tuneUpComponents/tuneUps/tuneUpService";
import { transactionHistoryService } from "@/services/transactionHistoryService";

function makeRepo() {
  return {
    findAll: vi.fn(),
    findByIdAsync: vi.fn(),
    transactionExists: vi.fn(),
    applyToTransaction: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe("tune up history", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs one entry for the tune up, not one per repair it copied in", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue({ tune_up_id: "t1", name: "Safety Check", cost: 40 });
    repo.transactionExists.mockResolvedValue(true);
    repo.applyToTransaction.mockResolvedValue([{ transaction_detail_id: "d1" }, { transaction_detail_id: "d2" }]);
    const history = vi.spyOn(transactionHistoryService, "recordByTransactionId").mockResolvedValue();

    const svc = new TuneUpService(repo as any);
    const res = await svc.applyToTransaction("t1", "user-1", "tx-1");

    expect(res.success).toBe(true);
    expect(history).toHaveBeenCalledTimes(1);
    expect(history).toHaveBeenCalledWith("tx-1", "user-1", [
      { change_type: "tune up", description: "added the Safety Check tune up (2 repairs)" },
    ]);
  });

  it("writes no history when the tune up does not exist", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue(null);
    const history = vi.spyOn(transactionHistoryService, "recordByTransactionId").mockResolvedValue();

    const svc = new TuneUpService(repo as any);
    const res = await svc.applyToTransaction("t1", "user-1", "tx-1");

    expect(res.success).toBe(false);
    expect(history).not.toHaveBeenCalled();
  });

  it("writes no history when the target transaction does not exist", async () => {
    const repo = makeRepo();
    repo.findByIdAsync.mockResolvedValue({ tune_up_id: "t1", name: "Safety Check", cost: 40 });
    repo.transactionExists.mockResolvedValue(false);
    const history = vi.spyOn(transactionHistoryService, "recordByTransactionId").mockResolvedValue();

    const svc = new TuneUpService(repo as any);
    const res = await svc.applyToTransaction("t1", "user-1", "tx-1");

    expect(res.success).toBe(false);
    expect(history).not.toHaveBeenCalled();
  });
});
