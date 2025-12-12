import { db } from "@/db/client";
import {
  bikes as bikesTable,
  customers as customersTable,
  items as itemsTable,
  repairs as repairsTable,
  transactionDetails as transactionDetailsTable,
  transactions as transactionsTable,
} from "@/db/schema";
import { and, asc, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import ExcelJS from "exceljs";

// Type definitions for export data
export interface RepairMetrics {
  repair_name: string;
  total_quantity: number;
  total_revenue: number;
  average_price: number;
  transaction_count: number;
  completion_rate: number;
}

export interface TransactionSummary {
  transaction_num: number;
  transaction_id: string;
  date_created: string;
  transaction_type: string;
  customer_name: string;
  customer_email: string;
  total_cost: number;
  is_completed: boolean;
  is_paid: boolean;
  is_refurb: boolean;
  is_employee: boolean;
  date_completed?: string;
  bike_make?: string;
  bike_model?: string;
  repair_items: string;
  parts_items: string;
}

export interface FinancialSummary {
  total_transactions: number;
  total_revenue: number;
  paid_transactions: number;
  paid_revenue: number;
  completed_transactions: number;
  pending_transactions: number;
  completion_rate: string;
  payment_rate: string;
  average_transaction_value: string;
}

export interface BikeInventory {
  bike_id: string;
  make: string;
  model: string;
  bike_type: string;
  size_cm: string;
  condition: string;
  price: string;
  is_available: string;
  weight_kg: string;
  reserved_by: string;
  deposit_amount: string;
  active_transactions: number;
  date_created: string;
}

export interface ItemInventory {
  upc: string;
  name: string;
  standard_price: number;
  wholesale_cost: number;
  stock: number;
}

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  isCompleted?: boolean;
  isPaid?: boolean;
  includeRefurb?: boolean;
  includeEmployee?: boolean;
}

function buildTransactionConditions(filters: ExportFilters = {}) {
  const conditions = [];

  if (filters.startDate) {
    conditions.push(gte(transactionsTable.date_created, new Date(filters.startDate)));
  }
  if (filters.endDate) {
    conditions.push(lte(transactionsTable.date_created, new Date(filters.endDate)));
  }
  if (filters.transactionType) {
    conditions.push(eq(transactionsTable.transaction_type, filters.transactionType));
  }
  if (filters.isCompleted !== undefined) {
    conditions.push(eq(transactionsTable.is_completed, filters.isCompleted));
  }
  if (filters.isPaid !== undefined) {
    conditions.push(eq(transactionsTable.is_paid, filters.isPaid));
  }
  if (filters.includeRefurb === false) {
    conditions.push(eq(transactionsTable.is_refurb, false));
  }
  if (filters.includeEmployee === false) {
    conditions.push(eq(transactionsTable.is_employee, false));
  }

  return conditions;
}

class DataExportService {
  // Get detailed repair metrics including labor profitability
  async getRepairMetrics(filters: ExportFilters = {}): Promise<RepairMetrics[]> {
    const txConditions = buildTransactionConditions(filters);

    // Join repairs -> transactionDetails -> transactions with filters applied on transactions
    const rows = await db
      .select({
        repair_id: repairsTable.repair_id,
        repair_name: repairsTable.name,
        repair_price: repairsTable.price,
        quantity: transactionDetailsTable.quantity,
        transaction_id: transactionDetailsTable.transaction_id,
        transaction_is_completed: transactionsTable.is_completed,
      })
      .from(repairsTable)
      .leftJoin(transactionDetailsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
      .leftJoin(transactionsTable, eq(transactionDetailsTable.transaction_id, transactionsTable.transaction_id))
      .where(and(eq(repairsTable.disabled, false), ...(txConditions.length ? txConditions : [])));

    // Process the data to calculate metrics grouped by repair
    const grouped = new Map<
      string,
      {
        totalQuantity: number;
        totalRevenue: number;
        price: number;
        transactionIds: Set<string>;
        completedTransactionIds: Set<string>;
      }
    >();

    for (const row of rows) {
      if (!row.repair_name || row.quantity == null || row.repair_price == null) {
        continue;
      }

      const key = row.repair_name;
      const quantity = Number(row.quantity) || 0;
      const price = Number(row.repair_price) || 0;

      if (!grouped.has(key)) {
        grouped.set(key, {
          totalQuantity: 0,
          totalRevenue: 0,
          price,
          transactionIds: new Set<string>(),
          completedTransactionIds: new Set<string>(),
        });
      }

      const agg = grouped.get(key)!;
      agg.totalQuantity += quantity;
      agg.totalRevenue += price * quantity;

      if (row.transaction_id) {
        agg.transactionIds.add(row.transaction_id);
        if (row.transaction_is_completed) {
          agg.completedTransactionIds.add(row.transaction_id);
        }
      }
    }

    const metrics: RepairMetrics[] = [];
    for (const [repair_name, agg] of grouped.entries()) {
      const transactionCount = agg.transactionIds.size;
      const completionRate = transactionCount > 0 ? (agg.completedTransactionIds.size / transactionCount) * 100 : 0;

      metrics.push({
        repair_name,
        total_quantity: agg.totalQuantity,
        total_revenue: agg.totalRevenue,
        average_price: agg.price,
        transaction_count: transactionCount,
        completion_rate: completionRate,
      });
    }

    // Filter out repairs with no transactions and sort by revenue desc
    return metrics.filter((m) => m.total_quantity > 0).sort((a, b) => b.total_revenue - a.total_revenue);
  }

  // Get comprehensive transaction summary
  async getTransactionSummary(filters: ExportFilters = {}): Promise<TransactionSummary[]> {
    const txConditions = buildTransactionConditions(filters);

    const rows = await db
      .select({
        t: transactionsTable,
        c_first: customersTable.first_name,
        c_last: customersTable.last_name,
        c_email: customersTable.email,
        b_make: bikesTable.make,
        b_model: bikesTable.model,
        d_id: transactionDetailsTable.transaction_detail_id,
        d_qty: transactionDetailsTable.quantity,
        i_name: itemsTable.name,
        i_cost: itemsTable.wholesale_cost,
        r_name: repairsTable.name,
        r_price: repairsTable.price,
      })
      .from(transactionsTable)
      .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
      .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
      .leftJoin(transactionDetailsTable, eq(transactionsTable.transaction_id, transactionDetailsTable.transaction_id))
      .leftJoin(itemsTable, eq(transactionDetailsTable.item_id, itemsTable.item_id))
      .leftJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
      .where(and(...(txConditions.length ? txConditions : [])))
      .orderBy(desc(transactionsTable.date_created));

    // Group by transaction and aggregate repair/items into strings
    const map = new Map<string, TransactionSummary & { _repairs: string[]; _parts: string[] }>();

    for (const row of rows) {
      const t = row.t;
      const key = t.transaction_id as string;
      if (!map.has(key)) {
        map.set(key, {
          transaction_num: t.transaction_num!,
          transaction_id: t.transaction_id!,
          date_created: (t.date_created as Date).toISOString().split("T")[0],
          transaction_type: t.transaction_type!,
          customer_name: `${row.c_first ?? ""} ${row.c_last ?? ""}`.trim(),
          customer_email: row.c_email ?? "",
          total_cost: Number(t.total_cost),
          is_completed: Boolean(t.is_completed),
          is_paid: Boolean(t.is_paid),
          is_refurb: Boolean(t.is_refurb),
          is_employee: Boolean(t.is_employee),
          date_completed: t.date_completed ? (t.date_completed as Date).toISOString().split("T")[0] : undefined,
          bike_make: row.b_make ?? undefined,
          bike_model: row.b_model ?? undefined,
          repair_items: "",
          parts_items: "",
          _repairs: [],
          _parts: [],
        });
      }

      const agg = map.get(key)!;

      // Append repair item if present
      if (row.r_name && row.d_qty != null && row.r_price != null) {
        agg._repairs.push(`${row.r_name} (${Number(row.d_qty)}x $${Number(row.r_price)})`);
      }

      // Append parts item if present
      if (row.i_name && row.d_qty != null && row.i_cost != null) {
        agg._parts.push(`${row.i_name} (${Number(row.d_qty)}x $${Number(row.i_cost)})`);
      }
    }

    // Finalize aggregated strings
    const result: TransactionSummary[] = [];
    for (const v of map.values()) {
      v.repair_items = v._repairs.join(", ");
      v.parts_items = v._parts.join(", ");
      (v as any)._repairs = undefined;
      (v as any)._parts = undefined;
      result.push(v);
    }

    return result;
  }

  // Get high-level financial summary
  async getFinancialSummary(filters: ExportFilters = {}): Promise<FinancialSummary> {
    const txConditions = buildTransactionConditions(filters);

    // Fetch transactions matching filters and compute aggregates in code
    const rows = await db
      .select()
      .from(transactionsTable)
      .where(and(...(txConditions.length ? txConditions : [])));

    const totalTransactions = rows.length;
    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.total_cost || 0), 0);

    const paidRows = rows.filter((r) => r.is_paid);
    const paidTransactionsCount = paidRows.length;
    const paidRevenue = paidRows.reduce((sum, r) => sum + Number(r.total_cost || 0), 0);

    const completedCount = rows.filter((r) => r.is_completed).length;
    const pendingCount = rows.filter((r) => !r.is_completed).length;

    return {
      total_transactions: totalTransactions,
      total_revenue: totalRevenue,
      paid_transactions: paidTransactionsCount,
      paid_revenue: paidRevenue,
      completed_transactions: completedCount,
      pending_transactions: pendingCount,
      completion_rate: totalTransactions > 0 ? `${((completedCount / totalTransactions) * 100).toFixed(1)}%` : "0%",
      payment_rate: totalTransactions > 0 ? `${((paidTransactionsCount / totalTransactions) * 100).toFixed(1)}%` : "0%",
      average_transaction_value: totalTransactions > 0 ? `$${(totalRevenue / totalTransactions).toFixed(2)}` : "$0.00",
    };
  }

  // Get repair history with transaction timing data
  async getRepairHistory(filters: ExportFilters = {}): Promise<any[]> {
    const txConditions = buildTransactionConditions(filters);

    const rows = await db
      .select({
        d: transactionDetailsTable,
        r: repairsTable,
        t: transactionsTable,
        c_first: customersTable.first_name,
        c_last: customersTable.last_name,
        c_email: customersTable.email,
        b_make: bikesTable.make,
        b_model: bikesTable.model,
        b_name: bikesTable.model, // model serves as name proxy if needed
      })
      .from(transactionDetailsTable)
      .leftJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
      .innerJoin(transactionsTable, eq(transactionDetailsTable.transaction_id, transactionsTable.transaction_id))
      .leftJoin(customersTable, eq(transactionsTable.customer_id, customersTable.customer_id))
      .leftJoin(bikesTable, eq(transactionsTable.bike_id, bikesTable.bike_id))
      .where(and(isNotNull(transactionDetailsTable.repair_id), ...(txConditions.length ? txConditions : [])))
      .orderBy(desc(transactionsTable.date_created));

    return rows.map((row) => {
      const d = row.d;
      const t = row.t;

      const dateCreated = t.date_created as Date;
      const dateModified = d.date_modified as Date;

      const daysToComplete =
        d.completed && dateModified && dateCreated
          ? Math.ceil((dateModified.getTime() - dateCreated.getTime()) / (1000 * 60 * 60 * 24))
          : null;

      return {
        id: d.transaction_detail_id,
        transaction_id: d.transaction_id,
        repair_id: d.repair_id,
        repair_name: row.r?.name,
        repair_description: row.r?.description || null,
        repair_cost: Number(row.r?.price || 0),
        quantity: d.quantity,
        total_cost: Number(row.r?.price || 0) * Number(d.quantity || 0),
        transaction_date_created: dateCreated.toISOString().split("T")[0],
        transaction_date_completed: t.date_completed ? (t.date_completed as Date).toISOString().split("T")[0] : null,
        repair_date_modified: dateModified ? dateModified.toISOString().split("T")[0] : null,
        days_to_complete: daysToComplete,
        transaction_status: t.is_completed ? "Transaction Completed" : "Transaction In Progress",
        repair_status: d.completed ? "Repair Completed" : "Repair In Progress",
        customer_name: `${row.c_first ?? ""} ${row.c_last ?? ""}`.trim(),
        customer_email: row.c_email ?? "",
        bike_name: row.b_name || null,
        bike_model: row.b_model || null,
        bike_brand: row.b_make || null,
      };
    });
  }

  // Get bike inventory with availability status
  async getBikeInventory(): Promise<BikeInventory[]> {
    // Correlated subquery for active transactions count per bike
    const activeTxSubquery = (bikeId: any) =>
      sql<number>`(select count(*) from "Transactions" t where t."bike_id" = ${bikeId} and t."is_completed" = false)`;

    const rows = await db
      .select({
        bike: bikesTable,
        rc_first: customersTable.first_name,
        rc_last: customersTable.last_name,
        active_transactions: activeTxSubquery(bikesTable.bike_id),
      })
      .from(bikesTable)
      .leftJoin(customersTable, eq(bikesTable.reservation_customer_id, customersTable.customer_id))
      .orderBy(desc(bikesTable.date_created));

    return rows.map((row) => {
      const b = row.bike;
      const reservedBy = row.rc_first && row.rc_last ? `${row.rc_first} ${row.rc_last}` : "";

      return {
        bike_id: b.bike_id!,
        make: b.make || "",
        model: b.model || "",
        bike_type: b.bike_type || "",
        size_cm: b.size_cm !== null && b.size_cm !== undefined ? String(b.size_cm) : "",
        condition: b.condition || "",
        price: b.price !== null && b.price !== undefined ? String(b.price) : "0",
        is_available: b.is_available ? "Yes" : "No",
        weight_kg: b.weight_kg !== null && b.weight_kg !== undefined ? String(b.weight_kg) : "",
        reserved_by: reservedBy,
        deposit_amount: b.deposit_amount !== null && b.deposit_amount !== undefined ? String(b.deposit_amount) : "0",
        active_transactions: Number(row.active_transactions || 0),
        date_created: (b.date_created as Date).toISOString().split("T")[0],
      };
    });
  }

  // Generate comprehensive Excel report
  async generateExcelReport(filters: ExportFilters = {}): Promise<Buffer> {
    const [repairMetrics, transactionSummary, financialSummary] = await Promise.all([
      this.getRepairMetrics(filters),
      this.getTransactionSummary(filters),
      this.getFinancialSummary(filters),
    ]);

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Financial Summary Sheet
    const financialSheet = workbook.addWorksheet("Financial Summary");
    const financialSummaryData = [
      ["Metric", "Value"],
      ["Total Transactions", financialSummary.total_transactions],
      ["Total Revenue", `$${financialSummary.total_revenue.toFixed(2)}`],
      ["Paid Transactions", financialSummary.paid_transactions],
      ["Paid Revenue", `$${financialSummary.paid_revenue.toFixed(2)}`],
      ["Completed Transactions", financialSummary.completed_transactions],
      ["Pending Transactions", financialSummary.pending_transactions],
      ["Completion Rate", financialSummary.completion_rate],
      ["Payment Rate", financialSummary.payment_rate],
      ["Average Transaction Value", financialSummary.average_transaction_value],
    ];
    financialSheet.addRows(financialSummaryData);

    // Repair Metrics Sheet
    if (repairMetrics.length > 0) {
      const repairSheet = workbook.addWorksheet("Repair Metrics");
      repairSheet.columns = [
        { header: "Repair Name", key: "repair_name" },
        { header: "Total Quantity", key: "total_quantity" },
        { header: "Total Revenue", key: "total_revenue" },
        { header: "Average Price", key: "average_price" },
        { header: "Transaction Count", key: "transaction_count" },
        { header: "Completion Rate", key: "completion_rate" },
      ];
      repairSheet.addRows(
        repairMetrics.map((metric) => ({
          repair_name: metric.repair_name,
          total_quantity: metric.total_quantity,
          total_revenue: `$${metric.total_revenue.toFixed(2)}`,
          average_price: `$${metric.average_price.toFixed(2)}`,
          transaction_count: metric.transaction_count,
          completion_rate: `${metric.completion_rate.toFixed(1)}%`,
        })),
      );
    }

    // Transaction Details Sheet
    if (transactionSummary.length > 0) {
      const transactionSheet = workbook.addWorksheet("Transaction Details");
      transactionSheet.columns = [
        { header: "Transaction #", key: "transaction_num" },
        { header: "Date Created", key: "date_created" },
        { header: "Type", key: "transaction_type" },
        { header: "Customer", key: "customer_name" },
        { header: "Email", key: "customer_email" },
        { header: "Total Cost", key: "total_cost" },
        { header: "Completed", key: "is_completed" },
        { header: "Paid", key: "is_paid" },
        { header: "Refurb", key: "is_refurb" },
        { header: "Employee", key: "is_employee" },
        { header: "Date Completed", key: "date_completed" },
        { header: "Bike Make", key: "bike_make" },
        { header: "Bike Model", key: "bike_model" },
        { header: "Repairs", key: "repair_items" },
        { header: "Parts", key: "parts_items" },
      ];
      transactionSheet.addRows(
        transactionSummary.map((transaction) => ({
          transaction_num: transaction.transaction_num,
          date_created: transaction.date_created,
          transaction_type: transaction.transaction_type,
          customer_name: transaction.customer_name,
          customer_email: transaction.customer_email,
          total_cost: `$${transaction.total_cost.toFixed(2)}`,
          is_completed: transaction.is_completed ? "Yes" : "No",
          is_paid: transaction.is_paid ? "Yes" : "No",
          is_refurb: transaction.is_refurb ? "Yes" : "No",
          is_employee: transaction.is_employee ? "Yes" : "No",
          date_completed: transaction.date_completed || "",
          bike_make: transaction.bike_make || "",
          bike_model: transaction.bike_model || "",
          repair_items: transaction.repair_items,
          parts_items: transaction.parts_items,
        })),
      );
    }

    // Convert to buffer
    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }

  // Generate repair history Excel
  async generateRepairHistoryExcel(filters: ExportFilters = {}): Promise<Buffer> {
    const repairHistory = await this.getRepairHistory(filters);

    const workbook = new ExcelJS.Workbook();

    if (repairHistory.length > 0) {
      const repairHistorySheet = workbook.addWorksheet("Repair History");
      repairHistorySheet.columns = [
        { header: "Detail ID", key: "id" },
        { header: "Transaction ID", key: "transaction_id" },
        { header: "Repair Name", key: "repair_name" },
        { header: "Repair Description", key: "repair_description" },
        { header: "Customer Name", key: "customer_name" },
        { header: "Customer Email", key: "customer_email" },
        { header: "Bike Brand", key: "bike_brand" },
        { header: "Bike Model", key: "bike_model" },
        { header: "Repair Cost", key: "repair_cost" },
        { header: "Quantity", key: "quantity" },
        { header: "Total Cost", key: "total_cost" },
        { header: "Transaction Created", key: "transaction_date_created" },
        { header: "Transaction Completed", key: "transaction_date_completed" },
        { header: "Repair Modified", key: "repair_date_modified" },
        { header: "Days to Complete", key: "days_to_complete" },
        { header: "Transaction Status", key: "transaction_status" },
        { header: "Repair Status", key: "repair_status" },
      ];
      repairHistorySheet.addRows(
        repairHistory.map((repair) => ({
          id: repair.id,
          transaction_id: repair.transaction_id,
          repair_name: repair.repair_name,
          repair_description: repair.repair_description || "",
          customer_name: repair.customer_name,
          customer_email: repair.customer_email,
          bike_brand: repair.bike_brand || "",
          bike_model: repair.bike_model || "",
          repair_cost: `$${repair.repair_cost.toFixed(2)}`,
          quantity: repair.quantity,
          total_cost: `$${repair.total_cost.toFixed(2)}`,
          transaction_date_created: repair.transaction_date_created,
          transaction_date_completed: repair.transaction_date_completed || "Not Completed",
          repair_date_modified: repair.repair_date_modified,
          days_to_complete: repair.days_to_complete || "Pending",
          transaction_status: repair.transaction_status,
          repair_status: repair.repair_status,
        })),
      );
    }

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }

  // Generate bike inventory Excel
  async generateBikeInventoryExcel(): Promise<Buffer> {
    const inventory = await this.getBikeInventory();

    const workbook = new ExcelJS.Workbook();

    if (inventory.length > 0) {
      const inventorySheet = workbook.addWorksheet("Bike Inventory");
      inventorySheet.columns = [
        { header: "Bike ID", key: "bike_id" },
        { header: "Make", key: "make" },
        { header: "Model", key: "model" },
        { header: "Type", key: "bike_type" },
        { header: "Size (cm)", key: "size_cm" },
        { header: "Condition", key: "condition" },
        { header: "Price", key: "price" },
        { header: "Available", key: "is_available" },
        { header: "Weight (kg)", key: "weight_kg" },
        { header: "Reserved By", key: "reserved_by" },
        { header: "Deposit", key: "deposit_amount" },
        { header: "Active Transactions", key: "active_transactions" },
        { header: "Date Created", key: "date_created" },
      ];
      inventorySheet.addRows(
        inventory.map((bike) => ({
          bike_id: bike.bike_id,
          make: bike.make,
          model: bike.model,
          bike_type: bike.bike_type,
          size_cm: bike.size_cm,
          condition: bike.condition,
          price: `$${Number.parseFloat(bike.price).toFixed(2)}`,
          is_available: bike.is_available,
          weight_kg: bike.weight_kg,
          reserved_by: bike.reserved_by,
          deposit_amount: `$${Number.parseFloat(bike.deposit_amount).toFixed(2)}`,
          active_transactions: bike.active_transactions,
          date_created: bike.date_created,
        })),
      );
    }

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }

  async getItemInventory(): Promise<ItemInventory[]> {
    const rows = await db
      .select({
        upc: itemsTable.upc,
        name: itemsTable.name,
        standard_price: itemsTable.standard_price,
        wholesale_cost: itemsTable.wholesale_cost,
        stock: itemsTable.stock,
      })
      .from(itemsTable)
      .where(eq(itemsTable.disabled, false))
      .orderBy(asc(itemsTable.name));

    return rows.map((row) => ({
      upc: row.upc,
      name: row.name,
      standard_price: Number(row.standard_price) || 0,
      wholesale_cost: Number(row.wholesale_cost) || 0,
      stock: row.stock || 0,
    }));
  }

  async generateItemInventoryExcel(): Promise<Buffer> {
    const inventory = await this.getItemInventory();

    const workbook = new ExcelJS.Workbook();

    // Item Inventory Sheet
    const inventorySheet = workbook.addWorksheet("Item Inventory");
    inventorySheet.columns = [
      { header: "UPC", key: "upc", width: 15 },
      { header: "Name", key: "name", width: 40 },
      { header: "Standard Price", key: "standard_price", width: 15 },
      { header: "Wholesale Cost", key: "wholesale_cost", width: 15 },
      { header: "Stock", key: "stock", width: 10 },
    ];

    inventorySheet.addRows(
      inventory.map((item) => ({
        upc: item.upc,
        name: item.name,
        standard_price: item.standard_price,
        wholesale_cost: item.wholesale_cost,
        stock: item.stock,
      })),
    );

    // Style the header row
    inventorySheet.getRow(1).font = { bold: true };
    inventorySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    return buffer;
  }
}

export const dataExportService = new DataExportService();
