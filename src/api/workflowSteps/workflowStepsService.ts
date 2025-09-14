import { ServiceResponse } from "@/common/models/serviceResponse";
import notificationTriggerService from "@/services/notificationTriggerService";
import { getTransactionWithDetails } from "@/services/transactionHelpers";
import { StatusCodes } from "http-status-codes";
import type {
  CreateWorkflowStep,
  UpdateWorkflowStep,
  WorkflowStep,
  WorkflowStepsQuery,
  WorkflowType,
} from "./workflowStepsModel";
import { createBikeSalesWorkflowSteps, createRepairWorkflowSteps } from "./workflowStepsModel";
import { workflowStepsRepository } from "./workflowStepsRepository";

export class WorkflowStepsService {
  /**
   * Initialize a complete workflow for a transaction
   */
  async initializeWorkflow(
    transactionId: string,
    workflowType: WorkflowType,
    createdByUserId: string,
  ): Promise<ServiceResponse<WorkflowStep[] | null>> {
    try {
      // Check if transaction exists
      const transactionExists = await workflowStepsRepository.transactionExists(transactionId);
      if (!transactionExists) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }

      if (!createdByUserId) {
        return ServiceResponse.failure(
          "User ID is required for workflow initialization",
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // Check if workflow already exists for this transaction and type
      const existingSteps = await workflowStepsRepository.findByTransactionAndWorkflow(transactionId, workflowType);
      if (existingSteps && existingSteps.length > 0) {
        return ServiceResponse.failure("Workflow already exists for this transaction", null, StatusCodes.CONFLICT);
      }

      let stepsToCreate: CreateWorkflowStep[] = [];

      // Generate steps based on workflow type
      switch (workflowType) {
        case "bike_sales":
          stepsToCreate = createBikeSalesWorkflowSteps(transactionId, createdByUserId);
          break;
        case "repair_process":
          stepsToCreate = createRepairWorkflowSteps(transactionId, createdByUserId);
          break;
        default:
          return ServiceResponse.failure("Unsupported workflow type", null, StatusCodes.BAD_REQUEST);
      }

      const createdSteps = await workflowStepsRepository.createMany(stepsToCreate);

      const transformedSteps = createdSteps.map((step) => ({
        step_id: step.step_id,
        transaction_id: step.transaction_id,
        workflow_type: step.workflow_type as WorkflowType,
        step_name: step.step_name,
        step_order: step.step_order,
        is_completed: step.is_completed,
        created_by: step.created_by,
        completed_by: step.completed_by,
        created_at: step.created_at.toISOString(),
        completed_at: step.completed_at?.toISOString() || null,
        updated_at: step.updated_at.toISOString(),
      }));

      return ServiceResponse.success(
        `${workflowType} workflow initialized successfully`,
        transformedSteps,
        StatusCodes.CREATED,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return ServiceResponse.failure(
        `Error initializing ${workflowType} workflow: ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workflow steps with optional filtering
   */
  async getWorkflowSteps(query: WorkflowStepsQuery): Promise<ServiceResponse<WorkflowStep[] | null>> {
    try {
      const steps = await workflowStepsRepository.findWorkflowSteps(query);

      if (!steps || steps.length === 0) {
        return ServiceResponse.success("No workflow steps found", [], StatusCodes.OK);
      }

      const transformedSteps = steps.map((step) => ({
        step_id: step.step_id,
        transaction_id: step.transaction_id,
        workflow_type: step.workflow_type as WorkflowType,
        step_name: step.step_name,
        step_order: step.step_order,
        is_completed: step.is_completed,
        created_by: step.created_by,
        completed_by: step.completed_by,
        created_at: step.created_at.toISOString(),
        completed_at: step.completed_at?.toISOString() || null,
        updated_at: step.updated_at.toISOString(),
      }));

      return ServiceResponse.success("Workflow steps retrieved successfully", transformedSteps, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to retrieve workflow steps", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get workflow steps by transaction ID and workflow type
   */
  async getWorkflowStepsByTransaction(
    transactionId: string,
    workflowType: WorkflowType,
  ): Promise<ServiceResponse<WorkflowStep[] | null>> {
    try {
      const query: WorkflowStepsQuery = { transaction_id: transactionId, workflow_type: workflowType };
      const steps = await workflowStepsRepository.findWorkflowSteps(query);

      if (!steps || steps.length === 0) {
        return ServiceResponse.success("No workflow steps found for this transaction", [], StatusCodes.OK);
      }

      const transformedSteps = steps.map((step) => ({
        step_id: step.step_id,
        transaction_id: step.transaction_id,
        workflow_type: step.workflow_type as WorkflowType,
        step_name: step.step_name,
        step_order: step.step_order,
        is_completed: step.is_completed,
        created_by: step.created_by,
        completed_by: step.completed_by,
        created_at: step.created_at.toISOString(),
        completed_at: step.completed_at?.toISOString() || null,
        updated_at: step.updated_at.toISOString(),
      }));

      return ServiceResponse.success("Workflow steps retrieved successfully", transformedSteps, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to retrieve workflow steps", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a single workflow step by ID
   */
  async getWorkflowStepById(stepId: string): Promise<ServiceResponse<WorkflowStep | null>> {
    try {
      const step = await workflowStepsRepository.findById(stepId);

      if (!step) {
        return ServiceResponse.failure("Workflow step not found", null, StatusCodes.NOT_FOUND);
      }

      const transformedStep = {
        step_id: step.step_id,
        transaction_id: step.transaction_id,
        workflow_type: step.workflow_type as WorkflowType,
        step_name: step.step_name,
        step_order: step.step_order,
        is_completed: step.is_completed,
        created_by: step.created_by,
        completed_by: step.completed_by,
        created_at: step.created_at.toISOString(),
        completed_at: step.completed_at?.toISOString() || null,
        updated_at: step.updated_at.toISOString(),
      };

      return ServiceResponse.success("Workflow step retrieved successfully", transformedStep, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to retrieve workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a new workflow step
   */
  async createWorkflowStep(
    stepData: CreateWorkflowStep,
    createdByUserId?: string,
  ): Promise<ServiceResponse<WorkflowStep | null>> {
    try {
      // Check if transaction exists
      const transactionExists = await workflowStepsRepository.transactionExists(stepData.transaction_id);
      if (!transactionExists) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }

      // Use the provided user ID or the one from stepData (required)
      const finalStepData = {
        ...stepData,
        created_by: createdByUserId || stepData.created_by,
      };

      if (!finalStepData.created_by) {
        return ServiceResponse.failure("created_by user ID is required", null, StatusCodes.BAD_REQUEST);
      }

      const createdStep = await workflowStepsRepository.create(finalStepData);

      const transformedStep = {
        step_id: createdStep.step_id,
        transaction_id: createdStep.transaction_id,
        workflow_type: createdStep.workflow_type as WorkflowType,
        step_name: createdStep.step_name,
        step_order: createdStep.step_order,
        is_completed: createdStep.is_completed,
        created_by: createdStep.created_by,
        completed_by: createdStep.completed_by,
        created_at: createdStep.created_at.toISOString(),
        completed_at: createdStep.completed_at?.toISOString() || null,
        updated_at: createdStep.updated_at.toISOString(),
      };

      return ServiceResponse.success("Workflow step created successfully", transformedStep, StatusCodes.CREATED);
    } catch (error) {
      return ServiceResponse.failure("Failed to create workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Initialize bike sales workflow for a transaction (specific method for controller)
   */
  async initializeBikeSalesWorkflow(
    transactionId: string,
    createdByUserId: string,
  ): Promise<ServiceResponse<WorkflowStep[] | null>> {
    return this.initializeWorkflow(transactionId, "bike_sales", createdByUserId);
  }

  /**
   * Update a workflow step
   */
  async updateWorkflowStep(
    stepId: string,
    updateData: UpdateWorkflowStep,
    completedByUserId?: string,
  ): Promise<ServiceResponse<WorkflowStep | null>> {
    try {
      // Check if step exists
      const existingStep = await workflowStepsRepository.findById(stepId);
      if (!existingStep) {
        return ServiceResponse.failure("Workflow step not found", null, StatusCodes.NOT_FOUND);
      }

      // Use the provided user ID for completion
      const finalUpdateData = {
        ...updateData,
        completed_by: completedByUserId || updateData.completed_by,
      };

      const updatedStep = await workflowStepsRepository.update(stepId, finalUpdateData);

      const transformedStep = {
        step_id: updatedStep.step_id,
        transaction_id: updatedStep.transaction_id,
        workflow_type: updatedStep.workflow_type as WorkflowType,
        step_name: updatedStep.step_name,
        step_order: updatedStep.step_order,
        is_completed: updatedStep.is_completed,
        created_by: updatedStep.created_by,
        completed_by: updatedStep.completed_by,
        created_at: updatedStep.created_at.toISOString(),
        completed_at: updatedStep.completed_at?.toISOString() || null,
        updated_at: updatedStep.updated_at.toISOString(),
      };

      return ServiceResponse.success("Workflow step updated successfully", transformedStep, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to update workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a workflow step
   */
  async deleteWorkflowStep(stepId: string): Promise<ServiceResponse<null>> {
    try {
      // Check if step exists
      const existingStep = await workflowStepsRepository.findById(stepId);
      if (!existingStep) {
        return ServiceResponse.failure("Workflow step not found", null, StatusCodes.NOT_FOUND);
      }

      await workflowStepsRepository.delete(stepId);
      return ServiceResponse.success("Workflow step deleted successfully", null, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to delete workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get workflow progress summary
   */
  async getWorkflowProgress(transactionId: string, workflowType: WorkflowType): Promise<ServiceResponse<any | null>> {
    try {
      const progress = await workflowStepsRepository.getWorkflowProgress(transactionId, workflowType);

      if (progress.total_steps === 0) {
        return ServiceResponse.failure("No workflow found for this transaction and type", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success("Workflow progress retrieved successfully", progress, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to retrieve workflow progress", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Complete a workflow step
   */
  async completeWorkflowStep(stepId: string, completedByUserId: string): Promise<ServiceResponse<WorkflowStep | null>> {
    try {
      const existingStep = await workflowStepsRepository.findById(stepId);
      if (!existingStep) {
        return ServiceResponse.failure("Workflow step not found", null, StatusCodes.NOT_FOUND);
      }

      const updatedStep = await workflowStepsRepository.update(stepId, {
        is_completed: true,
        completed_by: completedByUserId,
      });

      const transformedStep = {
        step_id: updatedStep.step_id,
        transaction_id: updatedStep.transaction_id,
        workflow_type: updatedStep.workflow_type as WorkflowType,
        step_name: updatedStep.step_name,
        step_order: updatedStep.step_order,
        is_completed: updatedStep.is_completed,
        created_by: updatedStep.created_by,
        completed_by: updatedStep.completed_by,
        created_at: updatedStep.created_at.toISOString(),
        completed_at: updatedStep.completed_at?.toISOString() || null,
        updated_at: updatedStep.updated_at.toISOString(),
      };

      // Trigger notification for completed workflow step
      try {
        const transactionData = await getTransactionWithDetails(updatedStep.transaction_id);
        if (transactionData) {
          await notificationTriggerService.handleWorkflowStepCompletion(
            {
              step_id: updatedStep.step_id,
              step_name: updatedStep.step_name,
              is_completed: updatedStep.is_completed,
              transaction_id: updatedStep.transaction_id,
              workflow_type: updatedStep.workflow_type,
            },
            transactionData,
          );
        }
      } catch (notificationError) {
        // Log the notification error but don't fail the workflow step completion
        console.error("Failed to send workflow step completion notification:", notificationError);
      }

      return ServiceResponse.success("Workflow step completed successfully", transformedStep, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to complete workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Uncomplete a workflow step (mark as incomplete)
   */
  async uncompleteWorkflowStep(stepId: string): Promise<ServiceResponse<WorkflowStep | null>> {
    try {
      const existingStep = await workflowStepsRepository.findById(stepId);
      if (!existingStep) {
        return ServiceResponse.failure("Workflow step not found", null, StatusCodes.NOT_FOUND);
      }

      const updatedStep = await workflowStepsRepository.update(stepId, {
        is_completed: false,
        completed_by: undefined,
      });

      const transformedStep = {
        step_id: updatedStep.step_id,
        transaction_id: updatedStep.transaction_id,
        workflow_type: updatedStep.workflow_type as WorkflowType,
        step_name: updatedStep.step_name,
        step_order: updatedStep.step_order,
        is_completed: updatedStep.is_completed,
        created_by: updatedStep.created_by,
        completed_by: updatedStep.completed_by,
        created_at: updatedStep.created_at.toISOString(),
        completed_at: updatedStep.completed_at?.toISOString() || null,
        updated_at: updatedStep.updated_at.toISOString(),
      };

      return ServiceResponse.success("Workflow step marked as incomplete", transformedStep, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to uncomplete workflow step", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reset all workflow steps for a transaction (mark all as incomplete)
   */
  async resetWorkflowSteps(
    transactionId: string,
    workflowType: WorkflowType,
  ): Promise<ServiceResponse<WorkflowStep[] | null>> {
    try {
      // Check if transaction exists
      const transactionExists = await workflowStepsRepository.transactionExists(transactionId);
      if (!transactionExists) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }

      // Get all steps for this transaction and workflow type
      const query: WorkflowStepsQuery = { transaction_id: transactionId, workflow_type: workflowType };
      const existingSteps = await workflowStepsRepository.findWorkflowSteps(query);

      if (!existingSteps || existingSteps.length === 0) {
        return ServiceResponse.failure("No workflow steps found for this transaction", null, StatusCodes.NOT_FOUND);
      }

      // Reset all steps to incomplete
      const resetSteps = await workflowStepsRepository.resetWorkflowSteps(transactionId, workflowType);

      const transformedSteps = resetSteps.map((step) => ({
        step_id: step.step_id,
        transaction_id: step.transaction_id,
        workflow_type: step.workflow_type as WorkflowType,
        step_name: step.step_name,
        step_order: step.step_order,
        is_completed: step.is_completed,
        created_by: step.created_by,
        completed_by: step.completed_by,
        created_at: step.created_at.toISOString(),
        completed_at: step.completed_at?.toISOString() || null,
        updated_at: step.updated_at.toISOString(),
      }));

      return ServiceResponse.success("All workflow steps reset to incomplete", transformedSteps, StatusCodes.OK);
    } catch (error) {
      return ServiceResponse.failure("Failed to reset workflow steps", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const workflowStepsService = new WorkflowStepsService();
