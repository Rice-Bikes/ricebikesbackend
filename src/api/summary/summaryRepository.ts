import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { transactions as transactionsTable } from "@/db/schema/transactions";
import { and, count, eq, inArray, not } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { TransactionsSummary } from "../transactionComponents/transactions/transactionModel";

export class SummaryRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = drizzleDb) {
    this.db = dbInstance;
  }

  private async countWhere(whereClause: any): Promise<number> {
    const rows = await this.db.select({ value: count() }).from(transactionsTable).where(whereClause);
    // Drizzle returns count() as a number; ensure numeric type
    return rows.length > 0 ? Number(rows[0].value) : 0;
  }

  async getTransactionsSummary(): Promise<TransactionsSummary> {
    try {
      // quantity_incomplete:
      // is_completed = false
      // is_refurb = false
      // is_employee = false
      // is_beer_bike = false
      // transaction_type NOT IN ('retrospec', 'Retrospec')
      const quantity_incomplete = await this.countWhere(
        and(
          eq(transactionsTable.is_completed, false),
          eq(transactionsTable.is_refurb, false),
          eq(transactionsTable.is_employee, false),
          eq(transactionsTable.is_beer_bike, false),
          not(inArray(transactionsTable.transaction_type, ["retrospec", "Retrospec"])),
        ),
      );

      // quantity_beer_bike_incomplete:
      // is_completed = false
      // is_refurb = false
      // is_employee = false
      // is_beer_bike = true
      // transaction_type NOT IN ('retrospec', 'Retrospec')
      const quantity_beer_bike_incomplete = await this.countWhere(
        and(
          eq(transactionsTable.is_completed, false),
          eq(transactionsTable.is_refurb, false),
          eq(transactionsTable.is_employee, false),
          eq(transactionsTable.is_beer_bike, true),
          not(inArray(transactionsTable.transaction_type, ["retrospec", "Retrospec"])),
        ),
      );

      // quantity_waiting_on_pickup:
      // is_completed = true
      // is_paid = false
      // is_refurb = false
      // is_employee = false
      // transaction_type NOT IN ('retrospec', 'Retrospec', 'merch', 'Merch')
      const quantity_waiting_on_pickup = await this.countWhere(
        and(
          eq(transactionsTable.is_completed, true),
          eq(transactionsTable.is_paid, false),
          eq(transactionsTable.is_refurb, false),
          eq(transactionsTable.is_employee, false),
          not(inArray(transactionsTable.transaction_type, ["retrospec", "Retrospec", "merch", "Merch"])),
        ),
      );

      // quantity_waiting_on_safety_check:
      // Not implemented previously; keeping placeholder as 0 until business rule is defined.
      const quantity_waiting_on_safety_check = 0;

      const summary: TransactionsSummary = {
        quantity_incomplete,
        quantity_beer_bike_incomplete,
        quantity_waiting_on_pickup,
        quantity_waiting_on_safety_check,
      };

      return summary;
    } catch (error) {
      logger.error({ error }, "[SummaryRepository] getTransactionsSummary error");
      throw error;
    }
  }
}
