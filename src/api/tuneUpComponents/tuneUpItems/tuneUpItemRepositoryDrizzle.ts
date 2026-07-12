import type {
  CreateTuneUpItemInput,
  TuneUpItem,
  UpdateTuneUpItemInput,
} from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { repairs } from "@/db/schema/repairs";
import { tuneUpItems } from "@/db/schema/tuneUpItems";
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export interface TuneUpItemFilters {
  tune_up_id?: string;
  repair_id?: string;
}

export class TuneUpItemRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
  }

  /**
   * Helper method to map a joined database record to a TuneUpItem model,
   * with the repair inlined.
   */
  private mapToTuneUpItem(record: any): TuneUpItem {
    if (!record) {
      throw new Error("Cannot map null or undefined record to TuneUpItem");
    }

    return {
      tune_up_item_id: record.tune_up_item_id,
      tune_up_id: record.tune_up_id,
      Repair: record.Repair,
    };
  }

  private selectWithRepair() {
    return this.db
      .select({
        tune_up_item_id: tuneUpItems.tune_up_item_id,
        tune_up_id: tuneUpItems.tune_up_id,
        Repair: repairs,
      })
      .from(tuneUpItems)
      .innerJoin(repairs, eq(tuneUpItems.repair_id, repairs.repair_id));
  }

  /**
   * Find all tune up items with optional filtering, with the repair inlined
   */
  async findAll(filters?: TuneUpItemFilters): Promise<TuneUpItem[]> {
    try {
      const conditions = [];

      if (filters) {
        if (filters.tune_up_id) {
          conditions.push(eq(tuneUpItems.tune_up_id, filters.tune_up_id));
        }
        if (filters.repair_id) {
          conditions.push(eq(tuneUpItems.repair_id, filters.repair_id));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.selectWithRepair().where(whereClause);

      return result.map((record) => this.mapToTuneUpItem(record));
    } catch (error) {
      logger.error(`[TuneUpItemRepositoryDrizzle] findAll error: ${error}`);
      throw error;
    }
  }

  /**
   * Find tune up item by ID, with the repair inlined
   */
  async findByIdAsync(tune_up_item_id: string): Promise<TuneUpItem | null> {
    try {
      const result = await this.selectWithRepair().where(eq(tuneUpItems.tune_up_item_id, tune_up_item_id)).limit(1);

      return result.length > 0 ? this.mapToTuneUpItem(result[0]) : null;
    } catch (error) {
      logger.error(`[TuneUpItemRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new tune up item
   */
  async create(itemData: CreateTuneUpItemInput): Promise<TuneUpItem> {
    try {
      const [inserted] = await this.db
        .insert(tuneUpItems)
        .values({
          tune_up_item_id: crypto.randomUUID(),
          tune_up_id: itemData.tune_up_id,
          repair_id: itemData.repair_id,
        })
        .returning();

      const created = await this.findByIdAsync(inserted.tune_up_item_id);
      if (!created) {
        throw new Error("Failed to create tune up item");
      }

      return created;
    } catch (error) {
      logger.error({ error, itemData }, "[TuneUpItemRepositoryDrizzle] create error");
      throw error;
    }
  }

  /**
   * Update an existing tune up item
   */
  async update(tune_up_item_id: string, updateData: UpdateTuneUpItemInput): Promise<TuneUpItem | null> {
    try {
      if (updateData.repair_id === undefined) {
        return this.findByIdAsync(tune_up_item_id);
      }

      const result = await this.db
        .update(tuneUpItems)
        .set({ repair_id: updateData.repair_id })
        .where(eq(tuneUpItems.tune_up_item_id, tune_up_item_id))
        .returning();

      if (result.length === 0) {
        return null;
      }

      return this.findByIdAsync(tune_up_item_id);
    } catch (error) {
      logger.error({ error, updateData, tune_up_item_id }, "[TuneUpItemRepositoryDrizzle] update error");
      return null;
    }
  }

  /**
   * Delete a tune up item
   */
  async delete(tune_up_item_id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(tuneUpItems)
        .where(eq(tuneUpItems.tune_up_item_id, tune_up_item_id))
        .returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`[TuneUpItemRepositoryDrizzle] delete error: ${error}`);
      return false;
    }
  }
}
