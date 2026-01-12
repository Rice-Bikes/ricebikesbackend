import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db client so we can control query results
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db/client";
import { dataExportService } from "@/services/dataExportService";

function chainableWithResult<T>(rows: T[]): any {
  // Create a base chainable object
  const chainable = {
    from: function () {
      return this;
    },
    leftJoin: function () {
      return this;
    },
    innerJoin: function () {
      return this;
    },
    orderBy: function () {
      return this;
    },
    where: function () {
      return this;
    },
  };

  // Wrap with promise using Promise.resolve().then pattern instead of direct then property
  const promise = Promise.resolve(rows);

  // Return a proxy that delegates chainable calls and promise operations
  return Object.assign(promise, chainable);
}

describe("DataExportService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates repair metrics (aggregation, completion rate, sorting) and skips invalid rows", async () => {
    const rows = [
      {
        repair_id: "r1",
        repair_name: "Tune",
        repair_price: "10",
        quantity: 2,
        transaction_id: "tx1",
        transaction_is_completed: true,
      },
      {
        repair_id: "r1",
        repair_name: "Tune",
        repair_price: "10",
        quantity: 1,
        transaction_id: "tx2",
        transaction_is_completed: false,
      },
      // Should be skipped due to missing name
      {
        repair_id: "r2",
        repair_name: null,
        repair_price: "5",
        quantity: 3,
        transaction_id: "tx3",
        transaction_is_completed: true,
      },
      // Another repair to check sorting
      {
        repair_id: "r3",
        repair_name: "Overhaul",
        repair_price: "25",
        quantity: 1,
        transaction_id: "tx4",
        transaction_is_completed: true,
      },
    ];

    (db.select as any).mockReturnValueOnce(chainableWithResult(rows));

    const metrics = await dataExportService.getRepairMetrics();

    // Only Tune and Overhaul should appear, Tune total 3 qty (30), Overhaul 1 qty (25)
    expect(metrics.length).toBe(2);

    // Overhaul has higher revenue (25) than Tune (30)? Actually Tune revenue = 30, Overhaul = 25 => Tune first
    expect(metrics[0].repair_name).toBe("Tune");
    expect(metrics[0].total_quantity).toBe(3);
    expect(metrics[0].total_revenue).toBe(30);
    expect(metrics[0].average_price).toBe(10);
    expect(metrics[0].transaction_count).toBe(2);
    // completion rate: 1 completed tx (tx1) of 2 => 50
    expect(metrics[0].completion_rate).toBeCloseTo(50);

    const overhaul = metrics.find((m) => m.repair_name === "Overhaul")!;
    expect(overhaul.total_quantity).toBe(1);
    expect(overhaul.total_revenue).toBe(25);
  });

  it("builds transaction summary grouping repairs and parts into strings and formats dates", async () => {
    const t = {
      transaction_num: 1,
      transaction_id: "tx-1",
      date_created: new Date("2020-01-01T12:00:00Z"),
      transaction_type: "Sale",
      total_cost: "100",
      is_completed: true,
      is_paid: false,
      is_refurb: false,
      is_employee: false,
      date_completed: new Date("2020-01-02T12:00:00Z"),
    };

    const rows = [
      {
        t,
        c_first: "John",
        c_last: "Doe",
        c_email: "john@example.com",
        b_make: "Brand",
        b_model: "ModelX",
        d_id: "d1",
        d_qty: 2,
        i_name: null,
        i_cost: null,
        r_name: "Tune",
        r_price: "10",
      },
      {
        t,
        c_first: "John",
        c_last: "Doe",
        c_email: "john@example.com",
        b_make: "Brand",
        b_model: "ModelX",
        d_id: "d2",
        d_qty: 1,
        i_name: "Wheel",
        i_cost: "5",
        r_name: null,
        r_price: null,
      },
    ];

    (db.select as any).mockReturnValueOnce(chainableWithResult(rows));

    const result = await dataExportService.getTransactionSummary();

    expect(result.length).toBe(1);
    const tx = result[0];
    expect(tx.transaction_id).toBe("tx-1");
    expect(tx.date_created).toBe("2020-01-01");
    expect(tx.customer_name).toBe("John Doe");
    expect(tx.repair_items).toContain("Tune (2x $10)");
    expect(tx.parts_items).toContain("Wheel (1x $5)");
  });

  it("produces correct financial summary for empty and non-empty transaction sets", async () => {
    // Case: no transactions
    (db.select as any).mockReturnValueOnce(chainableWithResult([]));
    let summary = await dataExportService.getFinancialSummary();
    expect(summary.total_transactions).toBe(0);
    expect(summary.total_revenue).toBe(0);
    expect(summary.completion_rate).toBe("0%");
    expect(summary.payment_rate).toBe("0%");
    expect(summary.average_transaction_value).toBe("$0.00");

    // Case: some transactions
    const rows = [
      { total_cost: "100", is_paid: true, is_completed: true },
      { total_cost: "50", is_paid: false, is_completed: false },
    ];
    (db.select as any).mockReturnValueOnce(chainableWithResult(rows));
    summary = await dataExportService.getFinancialSummary();
    expect(summary.total_transactions).toBe(2);
    expect(summary.total_revenue).toBe(150);
    expect(summary.paid_transactions).toBe(1);
    expect(summary.paid_revenue).toBe(100);
    expect(summary.completed_transactions).toBe(1);
    expect(summary.pending_transactions).toBe(1);
    expect(summary.completion_rate).toBe("50.0%");
    expect(summary.payment_rate).toBe("50.0%");
    expect(summary.average_transaction_value).toBe("$75.00");
  });

  it("generates repair history with correct days to complete and statuses", async () => {
    const rows = [
      {
        d: {
          transaction_detail_id: "d1",
          transaction_id: "tx-1",
          repair_id: "r1",
          quantity: 2,
          date_modified: new Date("2020-01-03T00:00:00Z"),
          completed: true,
        },
        r: {
          name: "Tune",
          description: "A good tune",
          price: "10",
        },
        t: {
          transaction_id: "tx-1",
          date_created: new Date("2020-01-01T00:00:00Z"),
          date_completed: null,
          is_completed: false,
        },
        c_first: "Jane",
        c_last: "Doe",
        c_email: "jane@example.com",
        b_make: "Brand",
        b_model: "Model",
        b_name: "Model",
      },
    ];

    (db.select as any).mockReturnValueOnce(chainableWithResult(rows));

    const history = await dataExportService.getRepairHistory();
    expect(history.length).toBe(1);
    const item = history[0];
    expect(item.id).toBe("d1");
    expect(item.repair_name).toBe("Tune");
    expect(item.days_to_complete).toBe(2); // 2020-01-03 - 2020-01-01 => 2 days
    expect(item.transaction_status).toBe("Transaction In Progress");
    expect(item.repair_status).toBe("Repair Completed");
    expect(item.total_cost).toBe(20); // 10 * quantity 2
  });

  it("maps bike inventory rows correctly", async () => {
    const rows = [
      {
        bike: {
          bike_id: "b1",
          make: "Brand",
          model: "Model",
          bike_type: "Road",
          size_cm: 54,
          condition: "Good",
          price: 200,
          is_available: true,
          weight_kg: 12,
          reservation_customer_id: null,
          deposit_amount: 50,
          date_created: new Date("2020-01-01T00:00:00Z"),
        },
        rc_first: "Res",
        rc_last: "Er",
        active_transactions: 1,
      },
    ];

    (db.select as any).mockReturnValueOnce(chainableWithResult(rows));

    const inventory = await dataExportService.getBikeInventory();
    expect(inventory.length).toBe(1);
    const b = inventory[0];
    expect(b.bike_id).toBe("b1");
    expect(b.make).toBe("Brand");
    expect(b.size_cm).toBe("54");
    expect(b.price).toBe("200");
    expect(b.is_available).toBe("Yes");
    expect(b.reserved_by).toBe("Res Er");
    expect(b.deposit_amount).toBe("50");
    expect(b.active_transactions).toBe(1);
    expect(b.date_created).toBe("2020-01-01");
  });

  it("returns item inventory and generates an Excel buffer", async () => {
    const itemRows = [
      {
        upc: "123",
        name: "Bolt",
        standard_price: "5.00",
        wholesale_cost: "3.00",
        stock: 10,
      },
    ];

    // Use a persistent return value so both the direct call and the internal call
    // (from generateItemInventoryExcel which calls getItemInventory again) return data.
    (db.select as any).mockReturnValue(chainableWithResult(itemRows));

    const items = await dataExportService.getItemInventory();
    expect(items.length).toBe(1);
    expect(items[0].upc).toBe("123");
    expect(items[0].standard_price).toBe(5);
    expect(items[0].wholesale_cost).toBe(3);
    expect(items[0].stock).toBe(10);

    // Generate Item Inventory Excel
    const buffer = await dataExportService.generateItemInventoryExcel();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("generates various Excel reports when underlying data exists", async () => {
    // Spy on the internal getters to avoid complex DB mocking for the report path
    const repairSpy = vi.spyOn(dataExportService, "getRepairMetrics").mockResolvedValue([
      {
        repair_name: "Tune",
        total_quantity: 1,
        total_revenue: 10,
        average_price: 10,
        transaction_count: 1,
        completion_rate: 100,
      },
    ]);
    const txSpy = vi.spyOn(dataExportService, "getTransactionSummary").mockResolvedValue([
      {
        transaction_num: 1,
        transaction_id: "tx-1",
        date_created: "2020-01-01",
        transaction_type: "Sale",
        customer_name: "A B",
        customer_email: "a@b.com",
        total_cost: 100,
        is_completed: true,
        is_paid: true,
        is_refurb: false,
        is_employee: false,
        repair_items: "Tune (1x $10)",
        parts_items: "",
      } as any,
    ]);
    const finSpy = vi.spyOn(dataExportService, "getFinancialSummary").mockResolvedValue({
      total_transactions: 1,
      total_revenue: 100,
      paid_transactions: 1,
      paid_revenue: 100,
      completed_transactions: 1,
      pending_transactions: 0,
      completion_rate: "100.0%",
      payment_rate: "100.0%",
      average_transaction_value: "$100.00",
    });

    const excelBuf = await dataExportService.generateExcelReport({});
    expect(excelBuf).toBeInstanceOf(Buffer);
    expect(excelBuf.length).toBeGreaterThan(0);

    // Repair history excel
    vi.spyOn(dataExportService, "getRepairHistory").mockResolvedValue([
      {
        id: "d1",
        transaction_id: "tx-1",
        repair_name: "Tune",
        repair_description: "desc",
        customer_name: "A B",
        customer_email: "a@b.com",
        bike_brand: "Brand",
        bike_model: "Model",
        repair_cost: 10,
        quantity: 1,
        total_cost: 10,
        transaction_date_created: "2020-01-01",
        transaction_date_completed: null,
        repair_date_modified: "2020-01-02",
        days_to_complete: 1,
        transaction_status: "Transaction Completed",
        repair_status: "Repair Completed",
      },
    ]);
    const historyBuf = await dataExportService.generateRepairHistoryExcel({});
    expect(historyBuf).toBeInstanceOf(Buffer);
    expect(historyBuf.length).toBeGreaterThan(0);

    // Bike inventory excel
    vi.spyOn(dataExportService, "getBikeInventory").mockResolvedValue([
      {
        bike_id: "b1",
        make: "Brand",
        model: "Model",
        bike_type: "Type",
        size_cm: "54",
        condition: "Good",
        price: "100",
        is_available: "Yes",
        weight_kg: "12",
        reserved_by: "",
        deposit_amount: "50",
        active_transactions: 0,
        date_created: "2020-01-01",
      },
    ]);
    const bikeBuf = await dataExportService.generateBikeInventoryExcel();
    expect(bikeBuf).toBeInstanceOf(Buffer);
    expect(bikeBuf.length).toBeGreaterThan(0);

    // Restore spies
    repairSpy.mockRestore();
    txSpy.mockRestore();
    finSpy.mockRestore();
  });

  it("handles empty sources when generating excel reports and filters in buildTransactionConditions", async () => {
    // When repair metrics and transaction summary are empty, financial sheet should still be generated without errors
    vi.spyOn(dataExportService, "getRepairMetrics").mockResolvedValue([]);
    vi.spyOn(dataExportService, "getTransactionSummary").mockResolvedValue([]);
    vi.spyOn(dataExportService, "getFinancialSummary").mockResolvedValue({
      total_transactions: 0,
      total_revenue: 0,
      paid_transactions: 0,
      paid_revenue: 0,
      completed_transactions: 0,
      pending_transactions: 0,
      completion_rate: "0%",
      payment_rate: "0%",
      average_transaction_value: "$0.00",
    } as any);

    const emptyReport = await dataExportService.generateExcelReport({});
    expect(emptyReport).toBeInstanceOf(Buffer);
    expect(emptyReport.length).toBeGreaterThan(0);

    // Empty repair history should still return a valid buffer
    vi.spyOn(dataExportService, "getRepairHistory").mockResolvedValue([]);
    const emptyHistory = await dataExportService.generateRepairHistoryExcel({});
    expect(emptyHistory).toBeInstanceOf(Buffer);
    expect(emptyHistory.length).toBeGreaterThan(0);

    // Empty bike inventory should still return a valid buffer
    vi.spyOn(dataExportService, "getBikeInventory").mockResolvedValue([]);
    const emptyInventory = await dataExportService.generateBikeInventoryExcel();
    expect(emptyInventory).toBeInstanceOf(Buffer);
    expect(emptyInventory.length).toBeGreaterThan(0);

    // Test filters are accepted by buildTransactionConditions via getRepairMetrics call
    const rows: any[] = [
      {
        repair_id: "r1",
        repair_name: "Tune",
        repair_price: 10,
        quantity: 1,
        transaction_id: "t1",
        transaction_is_completed: true,
      },
    ];

    (db.select as any).mockReturnValue(chainableWithResult(rows));

    const metrics = await dataExportService.getRepairMetrics({
      startDate: "2020-01-01",
      endDate: "2020-12-31",
      transactionType: "Sale",
      isCompleted: true,
      isPaid: false,
      includeRefurb: false,
      includeEmployee: false,
    });

    // Ensure method returns normally and processes rows when filters are provided
    expect(Array.isArray(metrics)).toBe(true);
  });
});
