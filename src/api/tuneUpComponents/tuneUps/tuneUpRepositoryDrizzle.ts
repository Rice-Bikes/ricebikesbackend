import type { TransactionDetails } from "@/api/transactionComponents/transactionDetails/transactionDetailsModel";
import type { CreateTuneUpInput, TuneUp, UpdateTuneUpInput } from "@/api/tuneUpComponents/tuneUps/tuneUpModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { repairs } from "@/db/schema/repairs";
import { transactionDetails, transactions } from "@/db/schema/transactions";
import { tuneUpItems } from "@/db/schema/tuneUpItems";
import { tuneUps } from "@/db/schema/tuneUps";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export class TuneUpRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
  }

  /**
   * Helper method to map database record to TuneUp model
   */
  private mapToTuneUp(record: any): TuneUp {
    if (!record) {
      throw new Error("Cannot map null or undefined record to TuneUp");
    }

    return {
      tune_up_id: record.tune_up_id,
      name: record.name,
      cost: Number(record.cost),
    };
  }

  /**
   * Find all tune ups
   */
  async findAll(): Promise<TuneUp[]> {
    try {
      const result = await this.db.select().from(tuneUps);

      return result.map((record) => this.mapToTuneUp(record));
    } catch (error) {
      logger.error(`[TuneUpRepositoryDrizzle] findAll error: ${error}`);
      throw error;
    }
  }

  /**
   * Find tune up by ID
   */
  async findByIdAsync(tune_up_id: string): Promise<TuneUp | null> {
    try {
      const result = await this.db.select().from(tuneUps).where(eq(tuneUps.tune_up_id, tune_up_id)).limit(1);

      return result.length > 0 ? this.mapToTuneUp(result[0]) : null;
    } catch (error) {
      logger.error(`[TuneUpRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new tune up
   */
  async create(tuneUpData: CreateTuneUpInput): Promise<TuneUp> {
    try {
      const result = await this.db
        .insert(tuneUps)
        .values({
          tune_up_id: crypto.randomUUID(),
          name: tuneUpData.name,
          cost: tuneUpData.cost,
        })
        .returning();

      return this.mapToTuneUp(result[0]);
    } catch (error) {
      logger.error({ error, tuneUpData }, "[TuneUpRepositoryDrizzle] create error");
      throw error;
    }
  }

  /**
   * Update an existing tune up
   */
  async update(tune_up_id: string, updateData: UpdateTuneUpInput): Promise<TuneUp | null> {
    try {
      const result = await this.db
        .update(tuneUps)
        .set(updateData)
        .where(eq(tuneUps.tune_up_id, tune_up_id))
        .returning();

      return result.length > 0 ? this.mapToTuneUp(result[0]) : null;
    } catch (error) {
      logger.error({ error, updateData, tune_up_id }, "[TuneUpRepositoryDrizzle] update error");
      return null;
    }
  }

  /**
   * Delete a tune up. Tune up items belonging to it are cascade-deleted by
   * the database.
   */
  async delete(tune_up_id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(tuneUps).where(eq(tuneUps.tune_up_id, tune_up_id)).returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`[TuneUpRepositoryDrizzle] delete error: ${error}`);
      return false;
    }
  }

  /**
   * Check if a transaction exists
   */
  async transactionExists(transaction_id: string): Promise<boolean> {
    const result = await this.db
      .select({ transaction_id: transactions.transaction_id })
      .from(transactions)
      .where(eq(transactions.transaction_id, transaction_id))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Copies every repair currently in the tune up into the given transaction as
   * new, independent transaction details.
   */
  async applyToTransaction(
    tune_up_id: string,
    changed_by: string | null,
    transaction_id: string,
  ): Promise<TransactionDetails[]> {
    try {
      return await this.db.transaction(async (tx) => {
        const items = await tx.select().from(tuneUpItems).where(eq(tuneUpItems.tune_up_id, tune_up_id));

        if (items.length === 0) {
          return [];
        }

        const values = items.map((item) => {
          return {
            transaction_detail_id: crypto.randomUUID(),
            transaction_id,
            item_id: null,
            repair_id: item.repair_id,
            tune_up_id,
            completed: false,
            changed_by,
            quantity: 1,
            date_modified: new Date(),
          };
        });

        const inserted = await tx.insert(transactionDetails).values(values).returning();

        return inserted.map((record) => this.mapToTransactionDetails(record));
      });
    } catch (error) {
      logger.error({ error, tune_up_id, transaction_id }, "[TuneUpsRepositoryDrizzle] applyToTransaction error");
      throw error;
    }
  }

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
}
