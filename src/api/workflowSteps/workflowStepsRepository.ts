import { and, asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { transactions as transactionsTable } from "@/db/schema/transactions";
import { workflowSteps as workflowStepsTable } from "@/db/schema/workflowSteps";
import type { CreateWorkflowStep, UpdateWorkflowStep, WorkflowStepsQuery, WorkflowType } from "./workflowStepsModel";

export class WorkflowStepsRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  /**
   * Get workflow steps with optional filtering
   */
  async findWorkflowSteps(query: WorkflowStepsQuery) {
    const conditions = [];

    if (query.transaction_id) {
      conditions.push(eq(workflowStepsTable.transaction_id, query.transaction_id));
    }

    if (query.workflow_type) {
      conditions.push(eq(workflowStepsTable.workflow_type, query.workflow_type));
    }

    if (query.is_completed !== undefined) {
      conditions.push(eq(workflowStepsTable.is_completed, query.is_completed));
    }

    if (query.step_order) {
      conditions.push(eq(workflowStepsTable.step_order, query.step_order));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(workflowStepsTable)
      .where(whereClause as any)
      .orderBy(asc(workflowStepsTable.step_order), asc(workflowStepsTable.created_at));

    return rows;
  }

  /**
   * Get workflow steps by transaction ID and workflow type
   */
  async findByTransactionAndWorkflow(transactionId: string, workflowType: WorkflowType) {
    const rows = await this.db
      .select()
      .from(workflowStepsTable)
      .where(
        and(eq(workflowStepsTable.transaction_id, transactionId), eq(workflowStepsTable.workflow_type, workflowType)),
      )
      .orderBy(asc(workflowStepsTable.step_order));

    return rows;
  }

  /**
   * Get a single workflow step by ID
   */
  async findById(stepId: string) {
    const rows = await this.db.select().from(workflowStepsTable).where(eq(workflowStepsTable.step_id, stepId));

    return rows[0] || null;
  }

  /**
   * Create a new workflow step
   */
  async create(stepData: CreateWorkflowStep) {
    if (!stepData.created_by) {
      throw new Error("created_by is required");
    }

    const [inserted] = await this.db
      .insert(workflowStepsTable)
      .values({
        transaction_id: stepData.transaction_id,
        workflow_type: stepData.workflow_type,
        step_name: stepData.step_name,
        step_order: stepData.step_order,
        created_by: stepData.created_by,
        // is_completed defaults to false, timestamps default via DB
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to create workflow step");
    }

    return inserted;
  }

  /**
   * Create multiple workflow steps (for initializing workflows)
   */
  async createMany(stepsData: CreateWorkflowStep[]) {
    const createdSteps = await this.db.transaction(async (tx) => {
      const results: Array<typeof workflowStepsTable.$inferSelect> = [];

      for (const stepData of stepsData) {
        if (!stepData.created_by) {
          throw new Error("created_by is required");
        }

        const [row] = await tx
          .insert(workflowStepsTable)
          .values({
            transaction_id: stepData.transaction_id,
            workflow_type: stepData.workflow_type,
            step_name: stepData.step_name,
            step_order: stepData.step_order,
            created_by: stepData.created_by,
          })
          .returning();

        if (!row) {
          throw new Error("Failed to create workflow step in batch");
        }

        results.push(row);
      }

      return results;
    });

    return createdSteps;
  }

  /**
   * Update a workflow step
   */
  async update(stepId: string, updateData: UpdateWorkflowStep) {
    const updatePayload: Partial<typeof workflowStepsTable.$inferInsert> = {
      updated_at: new Date(),
    };

    if (updateData.is_completed !== undefined) {
      updatePayload.is_completed = updateData.is_completed;

      if (updateData.is_completed) {
        updatePayload.completed_at = new Date();
        if (updateData.completed_by) {
          updatePayload.completed_by = updateData.completed_by;
        }
      } else {
        updatePayload.completed_at = null;
        updatePayload.completed_by = null;
      }
    }

    const [updated] = await this.db
      .update(workflowStepsTable)
      .set(updatePayload)
      .where(eq(workflowStepsTable.step_id, stepId))
      .returning();

    if (!updated) {
      throw new Error("Workflow step not found");
    }

    return updated;
  }

  /**
   * Delete a workflow step
   */
  async delete(stepId: string) {
    const [deleted] = await this.db
      .delete(workflowStepsTable)
      .where(eq(workflowStepsTable.step_id, stepId))
      .returning();

    return deleted || null;
  }

  /**
   * Check if a transaction exists
   */
  async transactionExists(transactionId: string) {
    const result = await this.db
      .select({ transaction_id: transactionsTable.transaction_id })
      .from(transactionsTable)
      .where(eq(transactionsTable.transaction_id, transactionId));

    return result.length > 0;
  }

  /**
   * Get workflow progress summary
   */
  async getWorkflowProgress(transactionId: string, workflowType: WorkflowType) {
    const steps = await this.db
      .select({
        step_id: workflowStepsTable.step_id,
        step_name: workflowStepsTable.step_name,
        step_order: workflowStepsTable.step_order,
        is_completed: workflowStepsTable.is_completed,
        completed_at: workflowStepsTable.completed_at,
      })
      .from(workflowStepsTable)
      .where(
        and(eq(workflowStepsTable.transaction_id, transactionId), eq(workflowStepsTable.workflow_type, workflowType)),
      )
      .orderBy(asc(workflowStepsTable.step_order));

    const totalSteps = steps.length;
    const completedSteps = steps.filter((s) => s.is_completed).length;
    const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      total_steps: totalSteps,
      completed_steps: completedSteps,
      progress_percentage: progressPercentage,
      current_step: steps.find((step) => !step.is_completed) || null,
      is_workflow_complete: completedSteps === totalSteps && totalSteps > 0,
      steps_summary: steps,
    };
  }

  /**
   * Reset all workflow steps for a transaction (mark all as incomplete)
   */
  async resetWorkflowSteps(transactionId: string, workflowType: WorkflowType) {
    await this.db
      .update(workflowStepsTable)
      .set({
        is_completed: false,
        completed_at: null,
        completed_by: null,
        updated_at: new Date(),
      })
      .where(
        and(eq(workflowStepsTable.transaction_id, transactionId), eq(workflowStepsTable.workflow_type, workflowType)),
      );

    // Return the updated steps
    const rows = await this.db
      .select()
      .from(workflowStepsTable)
      .where(
        and(eq(workflowStepsTable.transaction_id, transactionId), eq(workflowStepsTable.workflow_type, workflowType)),
      )
      .orderBy(asc(workflowStepsTable.step_order));

    return rows;
  }
}

export const workflowStepsRepository = new WorkflowStepsRepository();
