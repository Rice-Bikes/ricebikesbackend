/**
 * TransactionDetails Repository - Drizzle Implementation
 *
 * This file implements the TransactionDetails repository interface using Drizzle ORM.
 */

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { items as itemsTable } from "@/db/schema/items";
import { repairs as repairsTable } from "@/db/schema/repairs";
import {
  transactionDetails as transactionDetailsTable,
  transactions as transactionsTable,
} from "@/db/schema/transactions";
import { tuneUps as tuneUpsTable } from "@/db/schema/tuneUps";
import type { TransactionDetails, TransactionDetailsWithForeignKeys } from "./transactionDetailsModel";

/**
 * What the history needs to describe a change to a detail: which transaction it
 * belongs to, what it refers to by name, and whether it is currently complete.
 */
export interface DetailHistoryContext {
  transaction_num: number;
  item_name: string | null;
  repair_name: string | null;
  tune_up_name: string | null;
  quantity: number;
  completed: boolean;
}

/**
 * TransactionDetails Repository implementation using Drizzle ORM
 */
export class TransactionDetailsRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Find all transaction details
   */
  async findAllAsync(): Promise<TransactionDetails[]> {
    try {
      logger.debug("Finding all transaction details");

      const transactionDetails = await this.db
        .select()
        .from(transactionDetailsTable)
        .orderBy(desc(transactionDetailsTable.date_modified));

      return transactionDetails.map((detail) => this.mapToTransactionDetails(detail));
    } catch (error) {
      logger.error({ error }, "Error finding all transaction details");
      throw error;
    }
  }

  /**
   * Find transaction details by transaction ID with foreign keys
   */
  async findAllTransactionDetails(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    try {
      logger.debug({ transaction_id }, "Finding transaction details by transaction ID");

      const result = await this.db
        .select({
          transaction_detail_id: transactionDetailsTable.transaction_detail_id,
          transaction_id: transactionDetailsTable.transaction_id,
          item_id: transactionDetailsTable.item_id,
          repair_id: transactionDetailsTable.repair_id,
          tune_up_id: transactionDetailsTable.tune_up_id,
          changed_by: transactionDetailsTable.changed_by,
          completed: transactionDetailsTable.completed,
          quantity: transactionDetailsTable.quantity,
          date_modified: transactionDetailsTable.date_modified,
          Item: itemsTable,
          Repair: repairsTable,
        })
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.transaction_id, transaction_id))
        .leftJoin(itemsTable, eq(transactionDetailsTable.item_id, itemsTable.item_id))
        .leftJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
        .orderBy(desc(transactionDetailsTable.date_modified));

      return result.length ? result.map((record) => this.mapToTransactionDetailsWithForeignKeys(record)) : null;
    } catch (error) {
      logger.error({ error, transaction_id }, "Error finding transaction details by transaction ID");
      throw error;
    }
  }

  /**
   * Find repair transaction details by transaction ID
   */
  async findAllRepairs(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    try {
      logger.debug({ transaction_id }, "Finding repair transaction details");

      const result = await this.db
        .select({
          transaction_detail_id: transactionDetailsTable.transaction_detail_id,
          transaction_id: transactionDetailsTable.transaction_id,
          item_id: transactionDetailsTable.item_id,
          repair_id: transactionDetailsTable.repair_id,
          tune_up_id: transactionDetailsTable.tune_up_id,
          changed_by: transactionDetailsTable.changed_by,
          completed: transactionDetailsTable.completed,
          quantity: transactionDetailsTable.quantity,
          date_modified: transactionDetailsTable.date_modified,
          Repair: repairsTable,
        })
        .from(transactionDetailsTable)
        .where(and(eq(transactionDetailsTable.transaction_id, transaction_id), isNull(transactionDetailsTable.item_id)))
        .innerJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
        .orderBy(desc(transactionDetailsTable.date_modified));

      return result.length ? result.map((record) => this.mapToTransactionDetailsWithForeignKeys(record)) : null;
    } catch (error) {
      logger.error({ error, transaction_id }, "Error finding repair transaction details");
      throw error;
    }
  }

  /**
   * Find item transaction details by transaction ID
   */
  async findAllItems(transaction_id: string): Promise<TransactionDetailsWithForeignKeys[] | null> {
    try {
      logger.debug({ transaction_id }, "Finding item transaction details");

      const result = await this.db
        .select({
          transaction_detail_id: transactionDetailsTable.transaction_detail_id,
          transaction_id: transactionDetailsTable.transaction_id,
          item_id: transactionDetailsTable.item_id,
          repair_id: transactionDetailsTable.repair_id,
          tune_up_id: transactionDetailsTable.tune_up_id,
          changed_by: transactionDetailsTable.changed_by,
          completed: transactionDetailsTable.completed,
          quantity: transactionDetailsTable.quantity,
          date_modified: transactionDetailsTable.date_modified,
          Item: itemsTable,
        })
        .from(transactionDetailsTable)
        .where(
          and(eq(transactionDetailsTable.transaction_id, transaction_id), isNull(transactionDetailsTable.repair_id)),
        )
        .innerJoin(itemsTable, eq(transactionDetailsTable.item_id, itemsTable.item_id))
        .orderBy(desc(transactionDetailsTable.date_modified));

      return result.length ? result.map((record) => this.mapToTransactionDetailsWithForeignKeys(record)) : null;
    } catch (error) {
      logger.error({ error, transaction_id }, "Error finding item transaction details");
      throw error;
    }
  }

  /**
   * Create a new transaction detail
   */
  async createAsync(transactionDetail: TransactionDetails): Promise<TransactionDetailsWithForeignKeys> {
    try {
      logger.debug({ transactionDetail }, "Creating transaction detail");

      // Handle item stock update if item_id is provided
      if (transactionDetail.item_id) {
        const item = await this.db.select().from(itemsTable).where(eq(itemsTable.item_id, transactionDetail.item_id));

        if (item.length > 0) {
          await this.db
            .update(itemsTable)
            .set({ stock: item[0].stock! - (transactionDetail.quantity || 1) })
            .where(eq(itemsTable.item_id, transactionDetail.item_id));
        }
      }

      const transactionData = {
        ...transactionDetail,
        date_modified: transactionDetail.date_modified || new Date(),
      };

      const result = await this.db
        .insert(transactionDetailsTable)
        .values(transactionData as any)
        .returning();

      if (!result[0]) {
        throw new Error("Failed to create transaction detail");
      }

      const [withForeignKeys] = await this.db
        .select({
          transaction_detail_id: transactionDetailsTable.transaction_detail_id,
          transaction_id: transactionDetailsTable.transaction_id,
          item_id: transactionDetailsTable.item_id,
          repair_id: transactionDetailsTable.repair_id,
          tune_up_id: transactionDetailsTable.tune_up_id,
          changed_by: transactionDetailsTable.changed_by,
          completed: transactionDetailsTable.completed,
          quantity: transactionDetailsTable.quantity,
          date_modified: transactionDetailsTable.date_modified,
          Item: itemsTable,
          Repair: repairsTable,
        })
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.transaction_detail_id, result[0].transaction_detail_id))
        .leftJoin(itemsTable, eq(transactionDetailsTable.item_id, itemsTable.item_id))
        .leftJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id));

      logger.debug({ transactionDetailId: result[0].transaction_detail_id }, "Transaction detail created successfully");
      return this.mapToTransactionDetailsWithForeignKeys(withForeignKeys);
    } catch (error) {
      logger.error({ error }, "Error creating transaction detail");
      throw error;
    }
  }

  /**
   * Everything the history needs about one detail, in a single query.
   *
   * The history is keyed by transaction number while a detail only knows its
   * transaction's uuid, and describing the change needs the name of whatever
   * the detail points at, so both are fetched together. Callers that are about
   * to delete a detail have to call this first, while the row still exists.
   */
  async findHistoryContext(transaction_detail_id: string): Promise<DetailHistoryContext | null> {
    try {
      const rows = await this.db
        .select({
          transaction_num: transactionsTable.transaction_num,
          item_name: itemsTable.name,
          repair_name: repairsTable.name,
          tune_up_name: tuneUpsTable.name,
          quantity: transactionDetailsTable.quantity,
          completed: transactionDetailsTable.completed,
        })
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.transaction_detail_id, transaction_detail_id))
        .innerJoin(transactionsTable, eq(transactionDetailsTable.transaction_id, transactionsTable.transaction_id))
        .leftJoin(itemsTable, eq(transactionDetailsTable.item_id, itemsTable.item_id))
        .leftJoin(repairsTable, eq(transactionDetailsTable.repair_id, repairsTable.repair_id))
        .leftJoin(tuneUpsTable, eq(transactionDetailsTable.tune_up_id, tuneUpsTable.tune_up_id))
        .limit(1);

      if (rows.length === 0) {
        return null;
      }

      return {
        transaction_num: Number(rows[0].transaction_num),
        item_name: rows[0].item_name ?? null,
        repair_name: rows[0].repair_name ?? null,
        tune_up_name: rows[0].tune_up_name ?? null,
        quantity: Number(rows[0].quantity),
        completed: Boolean(rows[0].completed),
      };
    } catch (error) {
      logger.error({ error, transaction_detail_id }, "Error finding history context for transaction detail");
      throw error;
    }
  }

  /**
   * Update transaction detail status
   */
  async updateStatus(id: string, isDone: boolean): Promise<TransactionDetails | null> {
    try {
      logger.debug({ transactionDetailId: id, isDone }, "Updating transaction detail status");

      const result = await this.db
        .update(transactionDetailsTable)
        .set({ completed: isDone })
        .where(eq(transactionDetailsTable.transaction_detail_id, id))
        .returning();

      if (result.length === 0) {
        logger.warn({ transactionDetailId: id }, "Transaction detail not found for status update");
        return null;
      }

      logger.debug({ transactionDetailId: id }, "Transaction detail status updated successfully");
      return this.mapToTransactionDetails(result[0]);
    } catch (error) {
      logger.error({ error, transactionDetailId: id }, "Error updating transaction detail status");
      throw error;
    }
  }

  /**
   * Delete a transaction detail
   */
  async deleteAsync(id: string): Promise<TransactionDetails> {
    try {
      logger.debug({ transactionDetailId: id }, "Deleting transaction detail");

      // Handle item stock restoration if item was involved
      const detail = await this.db
        .select()
        .from(transactionDetailsTable)
        .where(eq(transactionDetailsTable.transaction_detail_id, id));

      if (detail.length > 0 && detail[0].item_id) {
        const item = await this.db.select().from(itemsTable).where(eq(itemsTable.item_id, detail[0].item_id));

        if (item.length > 0) {
          await this.db
            .update(itemsTable)
            .set({ stock: item[0].stock! + (detail[0].quantity || 1) })
            .where(eq(itemsTable.item_id, detail[0].item_id));
        }
      }

      const result = await this.db
        .delete(transactionDetailsTable)
        .where(eq(transactionDetailsTable.transaction_detail_id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Transaction detail not found for deletion");
      }

      logger.debug({ transactionDetailId: id }, "Transaction detail deleted successfully");
      return this.mapToTransactionDetails(result[0]);
    } catch (error) {
      logger.error({ error, transactionDetailId: id }, "Error deleting transaction detail");
      throw error;
    }
  }

  /**
   * Helper method to map database record to TransactionDetails model
   */
  private mapToTransactionDetails(record: any): TransactionDetails {
    if (!record) {
      throw new Error("Cannot map null or undefined record to TransactionDetails");
    }

    return {
      transaction_detail_id: record.transaction_detail_id,
      transaction_id: record.transaction_id,
      item_id: record.item_id || null,
      repair_id: record.repair_id || null,
      tune_up_id: record.tune_up_id || null,
      changed_by: record.changed_by || null,
      completed: Boolean(record.completed),
      quantity: Number(record.quantity),
      date_modified: record.date_modified,
    };
  }

  /**
   * Helper method to map database record to TransactionDetails model
   */
  private mapToTransactionDetailsWithForeignKeys(record: any): TransactionDetailsWithForeignKeys {
    if (!record) {
      throw new Error("Cannot map null or undefined record to TransactionDetailsWithForeignKeys");
    }

    if (record.Item) {
      return {
        ...this.mapToTransactionDetails(record),
        Item: (() => {
          return {
            ...record.Item,
            standard_price: Number(record.Item.standard_price),
            wholesale_cost: Number(record.Item.wholesale_cost),
          };
        })(),
      };
    }
    if (record.Repair) {
      return {
        ...this.mapToTransactionDetails(record),
        Repair: record.Repair,
      };
    }
    if (record.TuneUp) {
      return {
        ...this.mapToTransactionDetails(record),
        TuneUp: record.TuneUp,
      };
    }
    return this.mapToTransactionDetails(record);
  }
}
