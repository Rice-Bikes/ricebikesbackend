import type { CreateStepInput, Step, UpdateStepInput } from "@/api/steps/stepsModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db } from "@/db/client";
import type * as schema from "@/db/schema";
import { steps } from "@/db/schema/steps";
import { and, asc, eq, max } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// Default spacing between step_order values so steps can be inserted between
// two existing ones by passing the midpoint (e.g. 1000 and 2000 -> 1500)
// without needing to shift any other rows.
const STEP_ORDER_GAP = 1000;

export interface StepFilters {
  transaction_id?: string;
  bundle_id?: string;
  completed?: boolean;
}

export class StepsRepositoryDrizzle {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = db) {
    this.db = dbInstance;
  }

  /**
   * Helper method to map database record to Step model with proper type conversions
   */
  private mapToStep(record: any): Step {
    if (!record) {
      throw new Error("Cannot map null or undefined record to Step");
    }

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
   * Find all steps with optional filtering, ordered by step_order
   */
  async findAll(filters?: StepFilters): Promise<Step[]> {
    try {
      const conditions = [];

      if (filters) {
        if (filters.transaction_id) {
          conditions.push(eq(steps.transaction_id, filters.transaction_id));
        }
        if (filters.bundle_id) {
          conditions.push(eq(steps.bundle_id, filters.bundle_id));
        }
        if (filters.completed !== undefined) {
          conditions.push(eq(steps.completed, filters.completed));
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await this.db.select().from(steps).where(whereClause).orderBy(asc(steps.step_order));

      return result.map((record) => this.mapToStep(record));
    } catch (error) {
      logger.error(`[StepsRepositoryDrizzle] findAll error: ${error}`);
      throw error;
    }
  }

  /**
   * Find step by ID
   */
  async findByIdAsync(step_id: string): Promise<Step | null> {
    try {
      const result = await this.db.select().from(steps).where(eq(steps.step_id, step_id)).limit(1);

      return result.length > 0 ? this.mapToStep(result[0]) : null;
    } catch (error) {
      logger.error(`[StepsRepositoryDrizzle] findByIdAsync error: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new step. If step_order is omitted, the step is appended after
   * the last existing step under the same parent (transaction or bundle).
   */
  async create(stepData: CreateStepInput): Promise<Step> {
    try {
      let step_order = stepData.step_order;

      if (step_order === undefined) {
        const parentCondition = stepData.transaction_id
          ? eq(steps.transaction_id, stepData.transaction_id)
          : eq(steps.bundle_id, stepData.bundle_id as string);

        const [row] = await this.db
          .select({ maxOrder: max(steps.step_order) })
          .from(steps)
          .where(parentCondition);
        step_order = (row?.maxOrder ?? 0) + STEP_ORDER_GAP;
      }

      const result = await this.db
        .insert(steps)
        .values({
          step_id: crypto.randomUUID(),
          transaction_id: stepData.transaction_id ?? null,
          bundle_id: stepData.bundle_id ?? null,
          description: stepData.description,
          completed: stepData.completed ?? false,
          step_order,
        })
        .returning();

      return this.mapToStep(result[0]);
    } catch (error) {
      logger.error({ error, stepData }, "[StepsRepositoryDrizzle] create error");
      throw error;
    }
  }

  /**
   * Update an existing step
   */
  async update(step_id: string, updateData: UpdateStepInput): Promise<Step | null> {
    try {
      const result = await this.db.update(steps).set(updateData).where(eq(steps.step_id, step_id)).returning();

      return result.length > 0 ? this.mapToStep(result[0]) : null;
    } catch (error) {
      logger.error({ error, updateData, step_id }, "[StepsRepositoryDrizzle] update error");
      return null;
    }
  }

  /**
   * Delete a step
   */
  async delete(step_id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(steps).where(eq(steps.step_id, step_id)).returning();

      return result.length > 0;
    } catch (error) {
      logger.error(`[StepsRepositoryDrizzle] delete error: ${error}`);
      return false;
    }
  }
}
