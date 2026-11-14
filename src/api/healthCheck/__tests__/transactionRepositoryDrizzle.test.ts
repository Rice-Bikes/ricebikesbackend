import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TransactionRepositoryDrizzle from "@/api/transactionComponents/transactions/transactionRepositoryDrizzle";

describe("TransactionRepositoryDrizzle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it("findAll returns transactions and maps null transaction_id to empty string", async () => {
    const txRow = {
      transaction_num: 1,
      transaction_id: null, // should become ''
      is_completed: false,
      is_paid: false,
      is_urgent: false,
      is_beer_bike: false,
    } as any;

    const mockDb: any = {
      // select({ count }) is the total query; select({ transaction }) is the page.
      select: (arg?: any) =>
        arg?.count
          ? { from: () => ({ where: () => Promise.resolve([{ count: 42 }]) }) }
          : {
              from: () => ({
                where: () => ({
                  orderBy: () => ({
                    // Rows carry the computed sort key alongside the transaction.
                    limit: () => Promise.resolve([{ transaction: txRow, bucket: 1, sort_key: "2026-01-01 00:00:00" }]),
                  }),
                }),
              }),
            },
    };

    const repo = new TransactionRepositoryDrizzle(mockDb);
    const { transactions, next_cursor, total } = await repo.findAll({ page_limit: 10 });

    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBe(1);
    expect(transactions[0].transaction_num).toBe(1);
    // transaction_id should be coalesced to empty string
    expect(transactions[0].transaction_id).toBe("");
    // Fewer rows came back than the look-ahead limit, so this is the last page.
    expect(next_cursor).toBeNull();
    // total comes from the separate count query, not from the page length.
    expect(total).toBe(42);
  });

  it("findAllAggregate returns aggregated transactions and converts numeric bike fields", async () => {
    // The aggregate query returns rows like { transaction, bike, customer }
    const aggregateRow = {
      bucket: 1,
      sort_key: "2026-01-01 00:00:00",
      transaction: {
        transaction_id: "tx-123",
        transaction_num: 123,
        // other transaction fields not strictly needed for assertion
      },
      bike: {
        make: "Brand",
        model: "X",
        size_cm: "44", // should be converted to number 44
        price: "250.5", // should be converted to number 250.5
        weight_kg: "10", // converted to number 10
        deposit_amount: "25", // converted to number 25
      },
      customer: {
        first_name: "C",
        last_name: "D",
        email: "c@d.com",
      },
    };

    const orderRequestRows = [{ order_request_id: "or-1", transaction_id: "tx-123", amount: "10" }];

    const mockDb: any = {
      // select(arg) branch: if arg && arg.transaction then it's the aggregate initial query
      select: (arg?: any) => {
        if (arg?.transaction) {
          // emulate .from(...).leftJoin(...).leftJoin(...).where(...).orderBy(...).limit(...)
          return {
            from: () => ({
              leftJoin: () => ({
                leftJoin: () => ({
                  where: () => ({
                    orderBy: () => ({
                      limit: () => Promise.resolve([aggregateRow]),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (arg?.count) {
          return { from: () => ({ where: () => Promise.resolve([{ count: 7 }]) }) };
        }

        // default: select() for orderRequests or other simple selects
        return {
          from: () => ({
            where: () => Promise.resolve(orderRequestRows),
          }),
        };
      },
    };

    const repo = new TransactionRepositoryDrizzle(mockDb);
    const { transactions: results, total } = await repo.findAllAggregate({ page_limit: 10 });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);

    const agg = results[0] as any;
    // Transaction fields are flattened so transaction_id is on the root of agg
    expect(agg.transaction_id).toBe("tx-123");
    // Bike numeric fields should be converted to numbers
    expect(agg.Bike.price).toBeCloseTo(250.5);
    expect(agg.Bike.size_cm).toBe(44);
    expect(agg.Bike.weight_kg).toBe(10);
    expect(agg.Bike.deposit_amount).toBe(25);
    // OrderRequests should be returned as an array (not null)
    expect(Array.isArray(agg.OrderRequests)).toBe(true);
    expect(agg.OrderRequests[0].order_request_id).toBe("or-1");
    expect(total).toBe(7);
  });

  it("createTransaction inserts and returns created transaction (ensures transaction_id present)", async () => {
    const returned = {
      transaction_id: "tx-created",
      transaction_num: 999,
      // other fields...
    } as any;

    const valuesSpy = vi.fn().mockReturnValue({
      returning: () => Promise.resolve([returned]),
    });
    const insertMock = vi.fn().mockReturnValue({ values: valuesSpy });

    const mockDb: any = {
      insert: insertMock,
    };

    const repo = new TransactionRepositoryDrizzle(mockDb);
    const input = { total_cost: 50 } as any;
    const result = await repo.createTransaction(input);

    expect(insertMock).toHaveBeenCalled();
    // result should include the transaction_id coalesced (not null)
    expect(result.transaction_id).toBe("tx-created");
    expect(result.transaction_num).toBe(999);
  });

  it("getTransactionsSummary aggregates counts and returns numeric summary", async () => {
    // getTransactionsSummary performs three separate select(...).from(...).where(...) calls,
    // we simulate successive calls returning counts as strings (like SQL returns)
    const counts = [{ count: "7" }, { count: "3" }, { count: "5" }];
    let callIndex = 0;

    const mockDb: any = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([counts[callIndex++]]),
        }),
      }),
    };

    const repo = new TransactionRepositoryDrizzle(mockDb);
    const summary = await repo.getTransactionsSummary();

    expect(summary).toHaveProperty("quantity_incomplete");
    expect(summary).toHaveProperty("quantity_beer_bike_incomplete");
    expect(summary).toHaveProperty("quantity_waiting_on_pickup");

    expect(summary.quantity_incomplete).toBe(7);
    expect(summary.quantity_beer_bike_incomplete).toBe(3);
    expect(summary.quantity_waiting_on_pickup).toBe(5);
  });
});
