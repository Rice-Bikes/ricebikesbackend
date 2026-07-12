import type { CreateStepBundleInput, StepBundle, UpdateStepBundleInput } from "@/api/stepBundles/stepBundleModel";
import type { Step } from "@/api/steps/stepsModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { stepBundles } from "@/db/schema/stepBundles";
import { steps } from "@/db/schema/steps";
import { transactions } from "@/db/schema/transactions";
import { asc, eq, max } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Same spacing convention used by StepsRepositoryDrizzle, so steps copied
// out of a bundle stay consistent with steps created directly on a
// transaction.
const STEP_ORDER_GAP = 1000;

export class StepBundleRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
  }

  private mapToStepBundle(record: any): StepBundle {
    if (!record) {
      throw new Error("Cannot map null or undefined record to StepBundle");
    }

    return {
      bundle_id: record.bundle_id,
      name: record.name,
    };
  }

  private mapToStep(record: any): Step {
    return {
      step_id: record.step_id,
      transaction_id: record.transaction_id,
      bundle_id: record.bundle_id,
      description: record.description,
      completed: Boolean(record.completed),
      step_order: record.step_order,
    };
  }

  /**
   * Find all step bundles
   */
  async findAll(): Promise<StepBundle[]> {
    try {
      const result = await this.db.select().from(stepBundles);

      return result.map((record) => this.mapToStepBundle(record));
    } catch (error) {
      logger.error(`[StepBundleRepositoryDrizzle] findAll error: ${error}`);
      throw error;
    }
  }

  /**
   * Find step bundle by ID
   */
  async findByIdAsync(bundle_id: string): Promise<StepBundle | null> {
    try {
      const result = await this.db.select().from(stepBundles).where(eq(stepBundles.bundle_id, bundle_id)).limit(1);

      return result.length > 0 ? this.mapToStepBundle(result[0]) : null;
    } catch (error) {
      logger.error(`[StepBundleRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new step bundle
   */
  async create(bundleData: CreateStepBundleInput): Promise<StepBundle> {
    try {
      const result = await this.db
        .insert(stepBundles)
        .values({
          bundle_id: crypto.randomUUID(),
          name: bundleData.name,
        })
        .returning();

      return this.mapToStepBundle(result[0]);
    } catch (error) {
      logger.error({ error, bundleData }, "[StepBundleRepositoryDrizzle] create error");
      throw error;
    }
  }

  /**
   * Update an existing step bundle
   */
  async update(bundle_id: string, updateData: UpdateStepBundleInput): Promise<StepBundle | null> {
    try {
      const result = await this.db
        .update(stepBundles)
        .set(updateData)
        .where(eq(stepBundles.bundle_id, bundle_id))
        .returning();

      return result.length > 0 ? this.mapToStepBundle(result[0]) : null;
    } catch (error) {
      logger.error({ error, updateData, bundle_id }, "[StepBundleRepositoryDrizzle] update error");
      return null;
    }
  }

  /**
   * Delete a step bundle. Steps belonging to the bundle are cascade-deleted
   * by the database.
   */
  async delete(bundle_id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(stepBundles).where(eq(stepBundles.bundle_id, bundle_id)).returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`[StepBundleRepositoryDrizzle] delete error: ${error}`);
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
   * Copies every step currently in the bundle into the given transaction as
   * new, independent steps, appended after the transaction's existing
   * steps. The bundle and its own steps are left untouched.
   */
  async applyToTransaction(bundle_id: string, transaction_id: string): Promise<Step[]> {
    try {
      return await this.db.transaction(async (tx) => {
        const bundleSteps = await tx
          .select()
          .from(steps)
          .where(eq(steps.bundle_id, bundle_id))
          .orderBy(asc(steps.step_order));

        if (bundleSteps.length === 0) {
          return [];
        }

        const [row] = await tx
          .select({ maxOrder: max(steps.step_order) })
          .from(steps)
          .where(eq(steps.transaction_id, transaction_id));

        let nextOrder = row?.maxOrder ?? 0;

        const values = bundleSteps.map((step) => {
          nextOrder += STEP_ORDER_GAP;
          return {
            step_id: crypto.randomUUID(),
            transaction_id,
            bundle_id: null,
            description: step.description,
            completed: false,
            step_order: nextOrder,
          };
        });

        const inserted = await tx.insert(steps).values(values).returning();

        return inserted.map((record) => this.mapToStep(record));
      });
    } catch (error) {
      logger.error({ error, bundle_id, transaction_id }, "[StepBundleRepositoryDrizzle] applyToTransaction error");
      throw error;
    }
  }
}
