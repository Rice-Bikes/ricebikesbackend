import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

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

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  isCompleted?: boolean;
  isPaid?: boolean;
  includeRefurb?: boolean;
  includeEmployee?: boolean;
}

class DataExportService {
  // Get detailed repair metrics including labor profitability
  async getRepairMetrics(filters: ExportFilters = {}): Promise<RepairMetrics[]> {
    // Build transaction filters for the relation
    const transactionFilters: any = {
      date_created: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      },
      ...(filters.transactionType && { transaction_type: filters.transactionType }),
      ...(filters.isCompleted !== undefined && { is_completed: filters.isCompleted }),
      ...(filters.isPaid !== undefined && { is_paid: filters.isPaid }),
      ...(filters.includeRefurb === false && { is_refurb: false }),
      ...(filters.includeEmployee === false && { is_employee: false }),
    };

    // Remove empty date_created object if no date filters
    if (!filters.startDate && !filters.endDate) {
      transactionFilters.date_created = undefined;
    }

    // Get all repairs with their transaction details using the correct relationship names
    const repairs = await prisma.repairs.findMany({
      where: {
        disabled: false,
      },
      include: {
        TransactionDetails: {
          include: {
            Transactions: true,
          },
          where: {
            Transactions: transactionFilters,
          },
        },
      },
    });

    // Process the data to calculate metrics
    const repairMetrics: RepairMetrics[] = [];

    for (const repair of repairs) {
      const validDetails = repair.TransactionDetails.filter((td) => td.Transactions);

      if (validDetails.length === 0) continue;

      const totalQuantity = validDetails.reduce((sum: number, td: any) => sum + td.quantity, 0);
      const totalRevenue = validDetails.reduce((sum: number, td: any) => sum + Number(repair.price) * td.quantity, 0);
      const uniqueTransactions = new Set(validDetails.map((td: any) => td.transaction_id));
      const transactionCount = uniqueTransactions.size;

      // Calculate completion rate based on unique transactions
      const completedTransactions = validDetails.filter((td: any) => td.Transactions.is_completed);
      const uniqueCompletedTransactions = new Set(completedTransactions.map((td: any) => td.transaction_id));
      const completionRate = transactionCount > 0 ? (uniqueCompletedTransactions.size / transactionCount) * 100 : 0;

      repairMetrics.push({
        repair_name: repair.name,
        total_quantity: totalQuantity,
        total_revenue: totalRevenue,
        average_price: Number(repair.price),
        transaction_count: transactionCount,
        completion_rate: completionRate,
      });
    }

    // Filter out repairs with no transactions and sort by revenue
    return repairMetrics
      .filter((metric) => metric.total_quantity > 0)
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }

  // Get comprehensive transaction summary
  async getTransactionSummary(filters: ExportFilters = {}): Promise<TransactionSummary[]> {
    const whereClause: any = {};

    // Apply filters
    if (filters.startDate) {
      whereClause.dateCreated = { ...whereClause.dateCreated, gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      whereClause.dateCreated = { ...whereClause.dateCreated, lte: new Date(filters.endDate) };
    }
    if (filters.transactionType) {
      whereClause.transactionType = filters.transactionType;
    }
    if (filters.isCompleted !== undefined) {
      whereClause.isCompleted = filters.isCompleted;
    }
    if (filters.isPaid !== undefined) {
      whereClause.isPaid = filters.isPaid;
    }
    if (filters.includeRefurb === false) {
      whereClause.isRefurb = false;
    }
    if (filters.includeEmployee === false) {
      whereClause.isEmployee = false;
    }

    const transactions = await prisma.transactions.findMany({
      where: {
        date_created: {
          ...(filters.startDate && { gte: new Date(filters.startDate) }),
          ...(filters.endDate && { lte: new Date(filters.endDate) }),
        },
        ...(filters.transactionType && { transaction_type: filters.transactionType }),
        ...(filters.isCompleted !== undefined && { is_completed: filters.isCompleted }),
        ...(filters.isPaid !== undefined && { is_paid: filters.isPaid }),
        ...(filters.includeRefurb === false && { is_refurb: false }),
        ...(filters.includeEmployee === false && { is_employee: false }),
      },
      include: {
        Customer: true,
        Bike: true,
        TransactionDetails: {
          include: {
            Repair: true,
            Item: true,
          },
        },
      },
      orderBy: { date_created: "desc" },
    });

    return transactions.map((transaction: any) => ({
      transaction_num: transaction.transaction_num,
      transaction_id: transaction.transaction_id,
      date_created: transaction.date_created.toISOString().split("T")[0],
      transaction_type: transaction.transaction_type,
      customer_name: `${transaction.Customer.first_name} ${transaction.Customer.last_name}`,
      customer_email: transaction.Customer.email,
      total_cost: Number.parseFloat(transaction.total_cost.toString()),
      is_completed: transaction.is_completed,
      is_paid: transaction.is_paid,
      is_refurb: transaction.is_refurb,
      is_employee: transaction.is_employee,
      date_completed: transaction.date_completed?.toISOString().split("T")[0],
      bike_make: transaction.Bike?.make,
      bike_model: transaction.Bike?.model,
      repair_items: transaction.TransactionDetails.filter((td: any) => td.Repair)
        .map((td: any) => `${td.Repair.name} (${td.quantity}x $${td.Repair.price})`)
        .join(", "),
      parts_items: transaction.TransactionDetails.filter((td: any) => td.Item)
        .map((td: any) => `${td.Item.name} (${td.quantity}x $${td.Item.wholesale_cost})`)
        .join(", "),
    }));
  }

  // Get high-level financial summary
  async getFinancialSummary(filters: ExportFilters = {}): Promise<FinancialSummary> {
    const whereClause: any = {
      date_created: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      },
      ...(filters.transactionType && { transaction_type: filters.transactionType }),
      ...(filters.isCompleted !== undefined && { is_completed: filters.isCompleted }),
      ...(filters.isPaid !== undefined && { is_paid: filters.isPaid }),
      ...(filters.includeRefurb === false && { is_refurb: false }),
      ...(filters.includeEmployee === false && { is_employee: false }),
    };

    // Remove empty date_created object if no date filters
    if (!filters.startDate && !filters.endDate) {
      whereClause.date_created = undefined;
    }

    // Get aggregated data using Prisma aggregation
    const aggregations = await prisma.transactions.aggregate({
      where: whereClause,
      _count: {
        transaction_id: true,
      },
      _sum: {
        total_cost: true,
      },
    });

    // Get paid transactions count and revenue
    const paidAggregations = await prisma.transactions.aggregate({
      where: {
        ...whereClause,
        is_paid: true,
      },
      _count: {
        transaction_id: true,
      },
      _sum: {
        total_cost: true,
      },
    });

    // Get completed transactions count
    const completedCount = await prisma.transactions.count({
      where: {
        ...whereClause,
        is_completed: true,
      },
    });

    // Get pending transactions count
    const pendingCount = await prisma.transactions.count({
      where: {
        ...whereClause,
        is_completed: false,
      },
    });

    const totalTransactions = aggregations._count.transaction_id || 0;
    const totalRevenue = Number(aggregations._sum.total_cost) || 0;
    const paidTransactionsCount = paidAggregations._count.transaction_id || 0;
    const paidRevenue = Number(paidAggregations._sum.total_cost) || 0;

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
    // Build transaction filters
    const transactionFilters: any = {
      date_created: {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      },
      ...(filters.transactionType && { transaction_type: filters.transactionType }),
      ...(filters.isCompleted !== undefined && { is_completed: filters.isCompleted }),
      ...(filters.isPaid !== undefined && { is_paid: filters.isPaid }),
      ...(filters.includeRefurb === false && { is_refurb: false }),
      ...(filters.includeEmployee === false && { is_employee: false }),
    };

    // Remove empty date_created object if no date filters
    if (!filters.startDate && !filters.endDate) {
      transactionFilters.date_created = undefined;
    }

    // Get all transaction details that involve repairs with full transaction context
    const repairHistory = await prisma.transactionDetails.findMany({
      where: {
        repair_id: {
          not: null, // Only get transaction details that have repairs
        },
        Transactions: transactionFilters,
      },
      include: {
        Repair: true,
        Transactions: {
          include: {
            Customer: true,
            Bike: true,
          },
        },
      },
      orderBy: {
        Transactions: {
          date_created: "desc",
        },
      },
    });

    // Transform the data to provide repair history with timing information
    return repairHistory.map((detail: any) => ({
      id: detail.transaction_detail_id,
      transaction_id: detail.transaction_id,
      repair_id: detail.repair_id,
      repair_name: detail.Repair.name,
      repair_description: detail.Repair.description || null,
      repair_cost: Number(detail.Repair.price),
      quantity: detail.quantity,
      total_cost: Number(detail.Repair.price) * detail.quantity,
      transaction_date_created: detail.Transactions.date_created.toISOString().split("T")[0],
      transaction_date_completed: detail.Transactions.date_completed?.toISOString().split("T")[0] || null,
      repair_date_modified: detail.date_modified.toISOString().split("T")[0],
      days_to_complete:
        detail.completed && detail.date_modified
          ? Math.ceil((detail.date_modified - detail.Transactions.date_created) / (1000 * 60 * 60 * 24))
          : null,
      transaction_status: detail.Transactions.is_completed ? "Transaction Completed" : "Transaction In Progress",
      repair_status: detail.completed ? "Repair Completed" : "Repair In Progress",
      customer_name: `${detail.Transactions.Customer.first_name} ${detail.Transactions.Customer.last_name}`,
      customer_email: detail.Transactions.Customer.email,
      bike_name: detail.Transactions.Bike?.name || null,
      bike_model: detail.Transactions.Bike?.model || null,
      bike_brand: detail.Transactions.Bike?.make || null,
    }));
  }

  // Get bike inventory with availability status
  async getBikeInventory(): Promise<BikeInventory[]> {
    const bikes = await prisma.bikes.findMany({
      include: {
        _count: {
          select: {
            Transactions: {
              where: {
                is_completed: false,
              },
            },
          },
        },
        ReservationCustomer: true,
      },
      orderBy: { date_created: "desc" },
    });

    return bikes.map((bike: any) => ({
      bike_id: bike.bike_id,
      make: bike.make || "",
      model: bike.model || "",
      bike_type: bike.bike_type || "",
      size_cm: bike.size_cm?.toString() || "",
      condition: bike.condition || "",
      price: bike.price?.toString() || "0",
      is_available: bike.is_available ? "Yes" : "No",
      weight_kg: bike.weight_kg?.toString() || "",
      reserved_by: bike.ReservationCustomer
        ? `${bike.ReservationCustomer.first_name} ${bike.ReservationCustomer.last_name}`
        : "",
      deposit_amount: bike.deposit_amount?.toString() || "0",
      active_transactions: bike._count.Transactions,
      date_created: bike.date_created.toISOString().split("T")[0],
    }));
  }

  // Generate comprehensive Excel report
  async generateExcelReport(filters: ExportFilters = {}): Promise<Buffer> {
    const [repairMetrics, transactionSummary, financialSummary] = await Promise.all([
      this.getRepairMetrics(filters),
      this.getTransactionSummary(filters),
      this.getFinancialSummary(filters),
    ]);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Financial Summary Sheet
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
    const financialSheet = XLSX.utils.aoa_to_sheet(financialSummaryData);
    XLSX.utils.book_append_sheet(workbook, financialSheet, "Financial Summary");

    // Repair Metrics Sheet
    if (repairMetrics.length > 0) {
      const repairSheet = XLSX.utils.json_to_sheet(
        repairMetrics.map((metric) => ({
          "Repair Name": metric.repair_name,
          "Total Quantity": metric.total_quantity,
          "Total Revenue": `$${metric.total_revenue.toFixed(2)}`,
          "Average Price": `$${metric.average_price.toFixed(2)}`,
          "Transaction Count": metric.transaction_count,
          "Completion Rate": `${metric.completion_rate.toFixed(1)}%`,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, repairSheet, "Repair Metrics");
    }

    // Transaction Details Sheet
    if (transactionSummary.length > 0) {
      const transactionSheet = XLSX.utils.json_to_sheet(
        transactionSummary.map((transaction) => ({
          "Transaction #": transaction.transaction_num,
          "Date Created": transaction.date_created,
          Type: transaction.transaction_type,
          Customer: transaction.customer_name,
          Email: transaction.customer_email,
          "Total Cost": `$${transaction.total_cost.toFixed(2)}`,
          Completed: transaction.is_completed ? "Yes" : "No",
          Paid: transaction.is_paid ? "Yes" : "No",
          Refurb: transaction.is_refurb ? "Yes" : "No",
          Employee: transaction.is_employee ? "Yes" : "No",
          "Date Completed": transaction.date_completed || "",
          "Bike Make": transaction.bike_make || "",
          "Bike Model": transaction.bike_model || "",
          Repairs: transaction.repair_items,
          Parts: transaction.parts_items,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, transactionSheet, "Transaction Details");
    }

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  // Generate repair history Excel
  async generateRepairHistoryExcel(filters: ExportFilters = {}): Promise<Buffer> {
    const repairHistory = await this.getRepairHistory(filters);

    const workbook = XLSX.utils.book_new();

    if (repairHistory.length > 0) {
      const repairHistorySheet = XLSX.utils.json_to_sheet(
        repairHistory.map((repair) => ({
          "Detail ID": repair.id,
          "Transaction ID": repair.transaction_id,
          "Repair Name": repair.repair_name,
          "Repair Description": repair.repair_description || "",
          "Customer Name": repair.customer_name,
          "Customer Email": repair.customer_email,
          "Bike Brand": repair.bike_brand || "",
          "Bike Model": repair.bike_model || "",
          "Repair Cost": `$${repair.repair_cost.toFixed(2)}`,
          Quantity: repair.quantity,
          "Total Cost": `$${repair.total_cost.toFixed(2)}`,
          "Transaction Created": repair.transaction_date_created,
          "Transaction Completed": repair.transaction_date_completed || "Not Completed",
          "Repair Modified": repair.repair_date_modified,
          "Days to Complete": repair.days_to_complete || "Pending",
          "Transaction Status": repair.transaction_status,
          "Repair Status": repair.repair_status,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, repairHistorySheet, "Repair History");
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  // Generate bike inventory Excel
  async generateBikeInventoryExcel(): Promise<Buffer> {
    const inventory = await this.getBikeInventory();

    const workbook = XLSX.utils.book_new();

    if (inventory.length > 0) {
      const inventorySheet = XLSX.utils.json_to_sheet(
        inventory.map((bike) => ({
          "Bike ID": bike.bike_id,
          Make: bike.make,
          Model: bike.model,
          Type: bike.bike_type,
          "Size (cm)": bike.size_cm,
          Condition: bike.condition,
          Price: `$${Number.parseFloat(bike.price).toFixed(2)}`,
          Available: bike.is_available,
          "Weight (kg)": bike.weight_kg,
          "Reserved By": bike.reserved_by,
          Deposit: `$${Number.parseFloat(bike.deposit_amount).toFixed(2)}`,
          "Active Transactions": bike.active_transactions,
          "Date Created": bike.date_created,
        })),
      );
      XLSX.utils.book_append_sheet(workbook, inventorySheet, "Bike Inventory");
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }
}

export const dataExportService = new DataExportService();
