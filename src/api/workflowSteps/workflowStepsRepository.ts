import { PrismaClient } from "@prisma/client";
import type { CreateWorkflowStep, UpdateWorkflowStep, WorkflowStepsQuery, WorkflowType } from "./workflowStepsModel";

const prisma = new PrismaClient();

export class WorkflowStepsRepository {
  /**
   * Get workflow steps with optional filtering
   */
  async findWorkflowSteps(query: WorkflowStepsQuery) {
    const where: any = {};

    if (query.transaction_id) {
      where.transaction_id = query.transaction_id;
    }

    if (query.workflow_type) {
      where.workflow_type = query.workflow_type;
    }

    if (query.is_completed !== undefined) {
      where.is_completed = query.is_completed;
    }

    if (query.step_order) {
      where.step_order = query.step_order;
    }

    return prisma.workflowSteps.findMany({
      where,
      orderBy: [{ step_order: "asc" }, { created_at: "asc" }],
      include: {
        CreatedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        CompletedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        Transaction: {
          select: {
            transaction_id: true,
            transaction_num: true,
            transaction_type: true,
            Customer: {
              select: {
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get workflow steps by transaction ID and workflow type
   */
  async findByTransactionAndWorkflow(transactionId: string, workflowType: WorkflowType) {
    return prisma.workflowSteps.findMany({
      where: {
        transaction_id: transactionId,
        workflow_type: workflowType,
      },
      orderBy: { step_order: "asc" },
      include: {
        CreatedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        CompletedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Get a single workflow step by ID
   */
  async findById(stepId: string) {
    return prisma.workflowSteps.findUnique({
      where: { step_id: stepId },
      include: {
        CreatedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        CompletedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        Transaction: {
          select: {
            transaction_id: true,
            transaction_num: true,
            transaction_type: true,
            Customer: {
              select: {
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new workflow step
   */
  async create(stepData: CreateWorkflowStep) {
    // Ensure created_by is provided since it's required in the database
    if (!stepData.created_by) {
      throw new Error("created_by is required");
    }

    return prisma.workflowSteps.create({
      data: {
        transaction_id: stepData.transaction_id,
        workflow_type: stepData.workflow_type,
        step_name: stepData.step_name,
        step_order: stepData.step_order,
        created_by: stepData.created_by,
      },
      include: {
        CreatedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        Transaction: {
          select: {
            transaction_id: true,
            transaction_num: true,
            transaction_type: true,
            Customer: {
              select: {
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create multiple workflow steps (for initializing workflows)
   */
  async createMany(stepsData: CreateWorkflowStep[]) {
    const createdSteps = await prisma.$transaction(
      stepsData.map((stepData) => {
        // Ensure created_by is provided since it's required in the database
        if (!stepData.created_by) {
          throw new Error("created_by is required");
        }

        return prisma.workflowSteps.create({
          data: {
            transaction_id: stepData.transaction_id,
            workflow_type: stepData.workflow_type,
            step_name: stepData.step_name,
            step_order: stepData.step_order,
            created_by: stepData.created_by,
          },
          include: {
            CreatedByUser: {
              select: {
                user_id: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
          },
        });
      }),
    );

    return createdSteps;
  }

  /**
   * Update a workflow step
   */
  async update(stepId: string, updateData: UpdateWorkflowStep) {
    const updatePayload: any = {
      updated_at: new Date(),
    };

    if (updateData.is_completed !== undefined) {
      updatePayload.is_completed = updateData.is_completed;

      // If marking as completed, set completion timestamp and user
      if (updateData.is_completed) {
        updatePayload.completed_at = new Date();
        if (updateData.completed_by) {
          updatePayload.completed_by = updateData.completed_by;
        }
      } else {
        // If unmarking as completed, clear completion data
        updatePayload.completed_at = null;
        updatePayload.completed_by = null;
      }
    }

    return prisma.workflowSteps.update({
      where: { step_id: stepId },
      data: updatePayload,
      include: {
        CreatedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        CompletedByUser: {
          select: {
            user_id: true,
            firstname: true,
            lastname: true,
            username: true,
          },
        },
        Transaction: {
          select: {
            transaction_id: true,
            transaction_num: true,
            transaction_type: true,
            Customer: {
              select: {
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete a workflow step
   */
  async delete(stepId: string) {
    return prisma.workflowSteps.delete({
      where: { step_id: stepId },
    });
  }

  /**
   * Check if a transaction exists
   */
  async transactionExists(transactionId: string) {
    const transaction = await prisma.transactions.findUnique({
      where: { transaction_id: transactionId },
      select: { transaction_id: true },
    });
    return !!transaction;
  }

  /**
   * Get workflow progress summary
   */
  async getWorkflowProgress(transactionId: string, workflowType: WorkflowType) {
    const steps = await prisma.workflowSteps.findMany({
      where: {
        transaction_id: transactionId,
        workflow_type: workflowType,
      },
      orderBy: { step_order: "asc" },
      select: {
        step_id: true,
        step_name: true,
        step_order: true,
        is_completed: true,
        completed_at: true,
      },
    });

    const totalSteps = steps.length;
    const completedSteps = steps.filter((step) => step.is_completed).length;
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
    return prisma.workflowSteps
      .updateMany({
        where: {
          transaction_id: transactionId,
          workflow_type: workflowType,
        },
        data: {
          is_completed: false,
          completed_at: null,
          completed_by: null,
          updated_at: new Date(),
        },
      })
      .then(async () => {
        // Return the updated steps
        return prisma.workflowSteps.findMany({
          where: {
            transaction_id: transactionId,
            workflow_type: workflowType,
          },
          orderBy: { step_order: "asc" },
          include: {
            CreatedByUser: {
              select: {
                user_id: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
            CompletedByUser: {
              select: {
                user_id: true,
                firstname: true,
                lastname: true,
                username: true,
              },
            },
          },
        });
      });
  }
}

export const workflowStepsRepository = new WorkflowStepsRepository();
