import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db client before importing the module under test
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db/client";
import { getTransactionWithDetails } from "@/services/transactionHelpers";

function chainableWithResult<T>(rows: T[]) {
  const obj: any = {
    from: () => obj,
    leftJoin: () => obj,
    where: () => Promise.resolve(rows),
  };
  return obj;
}

describe("getTransactionWithDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no rows are found", async () => {
    (db.select as any).mockReturnValue(chainableWithResult([]));

    const result = await getTransactionWithDetails("non-existent");
    expect(result).toBeNull();
  });

  it("returns properly shaped transaction when row exists and price is numeric string", async () => {
    const mockRows = [
      {
        t: {
          transaction_num: 123,
          transaction_id: "tx-1",
          total_cost: "199.99",
          is_completed: true,
          is_reserved: false,
        },
        bike_make: "Brand",
        bike_model: "ModelX",
        bike_condition: "New",
        bike_price: "199.99",
        cust_first: "Jane",
        cust_last: "Doe",
        cust_email: "jane@example.com",
      },
    ];

    (db.select as any).mockReturnValue(chainableWithResult(mockRows));

    const result = await getTransactionWithDetails("tx-1");
    expect(result).not.toBeNull();
    expect(result?.transaction.transaction_num).toBe(123);
    expect(result?.transaction.transaction_id).toBe("tx-1");
    expect(result?.transaction.total_cost).toBe(199.99);
    expect(result?.bike?.make).toBe("Brand");
    expect(result?.bike?.price).toBeCloseTo(199.99);
    expect(result?.customer?.first_name).toBe("Jane");
  });

  it("handles errors thrown by db and returns null", async () => {
    (db.select as any).mockImplementation(() => {
      throw new Error("DB is down");
    });

    const result = await getTransactionWithDetails("tx-error");
    expect(result).toBeNull();
  });
});
