/**
 * TransactionLogs Repository - Drizzle Implementation
 *
 * This file implements the TransactionLogs repository interface using Drizzle ORM.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { transactionLogs as transactionLogsTable } from "@/db/schema/transactions";
import { users as usersTable } from "@/db/schema/users";
import type { TransactionLog, TransactionLogWithForeignKeys } from "./transactionLogsModel";

/**
 * TransactionLogs Repository implementation using Drizzle ORM
 */
export class TransactionLogsRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Find all transaction logs
   */
  async findAllAsync(): Promise<TransactionLog[]> {
    try {
      logger.debug("Finding all transaction logs");

      const transactionLogs = await this.db
        .select()
        .from(transactionLogsTable)
        .orderBy(desc(transactionLogsTable.date_modified));

      return transactionLogs.map((log) => this.mapToTransactionLog(log));
    } catch (error) {
      logger.error({ error }, "Error finding all transaction logs");
      throw error;
    }
  }

  /**
   * Find transaction logs by transaction number with foreign keys
   */
  async findAllTransactionLogs(transaction_num: number): Promise<TransactionLogWithForeignKeys[] | null> {
    try {
      logger.debug({ transaction_num }, "Finding transaction logs by transaction number");

      const result = await this.db
        .select({
          log_id: transactionLogsTable.log_id,
          transaction_num: transactionLogsTable.transaction_num,
          changed_by: transactionLogsTable.changed_by,
          date_modified: transactionLogsTable.date_modified,
          change_type: transactionLogsTable.change_type,
          description: transactionLogsTable.description,
          Users: usersTable,
        })
        .from(transactionLogsTable)
        .where(eq(transactionLogsTable.transaction_num, transaction_num))
        .leftJoin(usersTable, eq(transactionLogsTable.changed_by, usersTable.user_id))
        .orderBy(desc(transactionLogsTable.date_modified));

      return result.length ? result : null;
    } catch (error) {
      logger.error({ error, transaction_num }, "Error finding transaction logs by transaction number");
      throw error;
    }
  }

  /**
   * Create a new transaction log
   */
  async createAsync(transactionLog: TransactionLog): Promise<TransactionLog> {
    try {
      logger.debug({ transactionLog }, "Creating transaction log");

      const transactionData = {
        ...transactionLog,
        date_modified: transactionLog.date_modified || new Date(),
      };

      const result = await this.db
        .insert(transactionLogsTable)
        .values(transactionData as any)
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create transaction log");
      }

      logger.debug({ logId: result[0].log_id }, "Transaction log created successfully");
      return this.mapToTransactionLog(result[0]);
    } catch (error) {
      logger.error({ error }, "Error creating transaction log");
      throw error;
    }
  }

  /**
   * Helper method to map database record to TransactionLog model
   */
  private mapToTransactionLog(record: any): TransactionLog {
    if (!record) {
      throw new Error("Cannot map null or undefined record to TransactionLog");
    }

    return {
      log_id: record.log_id,
      transaction_num: Number(record.transaction_num),
      changed_by: record.changed_by,
      date_modified: record.date_modified,
      change_type: record.change_type,
      description: record.description,
    };
  }
}
