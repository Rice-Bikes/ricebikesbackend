/**
 * Writes transaction history.
 *
 * Several services change a transaction or something hanging off it, and all of
 * them have to leave a trace in TransactionLogs. They share this writer so that
 * the rules are in one place: a row names the person who caused the change, a
 * failed write never fails the change itself, and callers that only know a
 * transaction's uuid do not each repeat the lookup for its number.
 */

import { eq } from "drizzle-orm";

import { transactionLogService } from "@/api/transactionComponents/transactionLogs/transactionLogsService";
import { serviceLogger as logger } from "@/common/utils/logger";
import type { TransactionLogEntry } from "@/common/utils/transactionLogging";
import { db as drizzleDb } from "@/db/client";
import { transactions as transactionsTable } from "@/db/schema/transactions";

export class TransactionHistoryService {
  private db: typeof drizzleDb;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Records entries against a transaction number.
   *
   * The write is deliberately best-effort: whatever it describes has already
   * been committed by the time this runs, so failing the request over a log row
   * would report a change that did in fact happen as an error. A failure is
   * logged loudly instead.
   */
  async record(transaction_num: number, changed_by: string | undefined, entries: TransactionLogEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    if (!changed_by) {
      // The API requires a user on every endpoint that records history, so this
      // only happens on an internal call.
      logger.warn(`Skipping history for transaction ${transaction_num}: no user for ${entries.length} change(s)`);
      return;
    }

    for (const entry of entries) {
      try {
        const result = await transactionLogService.createTransactionLog(
          transaction_num,
          changed_by,
          entry.description,
          entry.change_type,
        );
        if (!result.success) {
          logger.error(`Failed to log "${entry.change_type}" for transaction ${transaction_num}: ${result.message}`);
        }
      } catch (ex) {
        logger.error(
          `Failed to log "${entry.change_type}" for transaction ${transaction_num}: ${(ex as Error).message}`,
        );
      }
    }
  }

  /**
   * Records entries against a transaction identified by its uuid.
   *
   * Transaction details, order requests and tune ups all refer to a transaction
   * by uuid while the history is keyed by number, so the number is looked up
   * here. A transaction that has gone missing is logged and skipped, for the
   * same reason the writes above are best-effort.
   */
  async recordByTransactionId(
    transaction_id: string | null | undefined,
    changed_by: string | undefined,
    entries: TransactionLogEntry[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    if (!transaction_id) {
      // Not everything that can be ordered belongs to a transaction.
      return;
    }

    let transaction_num: number;
    try {
      const transaction_num_or_null = await this.findTransactionNum(transaction_id);
      if (transaction_num_or_null === null) {
        logger.error(`Skipping history: no transaction found for id ${transaction_id}`);
        return;
      }
      transaction_num = transaction_num_or_null;
    } catch (ex) {
      logger.error(`Skipping history for transaction ${transaction_id}: ${(ex as Error).message}`);
      return;
    }

    await this.record(transaction_num, changed_by, entries);
  }

  /**
   * Records entries against every transaction a bike belongs to.
   *
   * A bike is reached through its own endpoint, which knows nothing about
   * transactions, so the transactions holding it are looked up here. Normally
   * that is exactly one, but nothing stops a bike from coming back on a second
   * visit, and an edit to it is equally part of both transactions' stories, so
   * each one gets the entries.
   */
  async recordByBikeId(
    bike_id: string | null | undefined,
    changed_by: string | undefined,
    entries: TransactionLogEntry[],
  ): Promise<void> {
    if (entries.length === 0 || !bike_id) {
      return;
    }

    let transaction_nums: number[];
    try {
      transaction_nums = await this.findTransactionNumsForBike(bike_id);
    } catch (ex) {
      logger.error(`Skipping history for bike ${bike_id}: ${(ex as Error).message}`);
      return;
    }

    // A bike that no transaction refers to has nowhere to record this. That is
    // a normal state for sale stock that has not been sold yet, not an error.
    for (const transaction_num of transaction_nums) {
      await this.record(transaction_num, changed_by, entries);
    }
  }

  /** The numbers of every transaction that refers to this bike. */
  async findTransactionNumsForBike(bike_id: string): Promise<number[]> {
    const rows = await this.db
      .select({ transaction_num: transactionsTable.transaction_num })
      .from(transactionsTable)
      .where(eq(transactionsTable.bike_id, bike_id));

    return rows.map((row) => Number(row.transaction_num));
  }

  /** The number of the transaction with this uuid, or null if there is none. */
  async findTransactionNum(transaction_id: string): Promise<number | null> {
    const rows = await this.db
      .select({ transaction_num: transactionsTable.transaction_num })
      .from(transactionsTable)
      .where(eq(transactionsTable.transaction_id, transaction_id))
      .limit(1);

    return rows.length > 0 ? Number(rows[0].transaction_num) : null;
  }
}

export const transactionHistoryService = new TransactionHistoryService();
