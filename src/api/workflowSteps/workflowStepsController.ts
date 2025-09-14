import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  CreateWorkflowStepSchema,
  UpdateWorkflowStepSchema,
  WorkflowStepsQuerySchema,
  WorkflowTypeEnum,
} from "./workflowStepsModel";
import { workflowStepsService } from "./workflowStepsService";

class WorkflowStepsController {
  /**
   * Get workflow steps with optional filtering
   * GET /workflow-steps?transaction_id=uuid&workflow_type=bike_sales&is_completed=false
   */
  public getWorkflowSteps: RequestHandler = async (req: Request, res: Response) => {
    try {
      const queryResult = WorkflowStepsQuerySchema.safeParse(req.query);

      if (!queryResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid query parameters",
          responseObject: queryResult.error.issues,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.getWorkflowSteps(queryResult.data);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Get workflow steps by transaction ID and workflow type
   * GET /workflow-steps/transaction/:transaction_id/:workflow_type
   */
  public getWorkflowStepsByTransaction: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { transaction_id, workflow_type } = req.params;

      // Validate workflow type
      const workflowTypeResult = WorkflowTypeEnum.safeParse(workflow_type);
      if (!workflowTypeResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "Invalid workflow type. Supported types: bike_sales, repair_process, order_fulfillment, custom_workflow",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate transaction_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid transaction ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.getWorkflowStepsByTransaction(
        transaction_id,
        workflowTypeResult.data,
      );
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Get a single workflow step by ID
   * GET /workflow-steps/:step_id
   */
  public getWorkflowStepById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { step_id } = req.params;

      // Validate step_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid step ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.getWorkflowStepById(step_id);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Create a new workflow step
   * POST /workflow-steps
   */
  public createWorkflowStep: RequestHandler = async (req: Request, res: Response) => {
    try {
      const stepDataResult = CreateWorkflowStepSchema.safeParse(req.body);

      if (!stepDataResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid request data",
          responseObject: stepDataResult.error.issues,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.createWorkflowStep(stepDataResult.data);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Initialize bike sales workflow for a transaction
   * POST /workflow-steps/initialize/bike-sales/:transaction_id
   */
  public initializeBikeSalesWorkflow: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { transaction_id } = req.params;
      const { created_by } = req.body;

      // Validate transaction_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid transaction ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate created_by if provided
      if (created_by && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(created_by)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid created_by user ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.initializeBikeSalesWorkflow(transaction_id, created_by);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Update a workflow step
   * PUT /workflow-steps/:step_id
   */
  public updateWorkflowStep: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { step_id } = req.params;

      // Validate step_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid step ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const updateDataResult = UpdateWorkflowStepSchema.safeParse(req.body);

      if (!updateDataResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid request data",
          responseObject: updateDataResult.error.issues,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.updateWorkflowStep(step_id, updateDataResult.data);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Delete a workflow step
   * DELETE /workflow-steps/:step_id
   */
  public deleteWorkflowStep: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { step_id } = req.params;

      // Validate step_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid step ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.deleteWorkflowStep(step_id);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Get workflow progress summary
   * GET /workflow-steps/progress/:transaction_id/:workflow_type
   */
  public getWorkflowProgress: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { transaction_id, workflow_type } = req.params;

      // Validate workflow type
      const workflowTypeResult = WorkflowTypeEnum.safeParse(workflow_type);
      if (!workflowTypeResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "Invalid workflow type. Supported types: bike_sales, repair_process, order_fulfillment, custom_workflow",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate transaction_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid transaction ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.getWorkflowProgress(transaction_id, workflowTypeResult.data);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Complete a workflow step
   * POST /workflow-steps/complete/:step_id
   */
  public completeWorkflowStep: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { step_id } = req.params;
      const { completed_by } = req.body;

      // Validate step_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid step ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate completed_by if provided
      if (completed_by && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(completed_by)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid completed_by user ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.completeWorkflowStep(step_id, completed_by);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Uncomplete a workflow step (mark as incomplete)
   * POST /workflow-steps/uncomplete/:step_id
   */
  public uncompleteWorkflowStep: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { step_id } = req.params;

      // Validate step_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(step_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid step ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.uncompleteWorkflowStep(step_id);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Reset workflow steps for a transaction
   * POST /workflow-steps/reset/:transaction_id
   */
  public resetWorkflowSteps: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { transaction_id } = req.params;
      const { workflow_type } = req.body;

      // Validate transaction_id is UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction_id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Invalid transaction ID format",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      // Validate workflow type
      const workflowTypeResult = WorkflowTypeEnum.safeParse(workflow_type);
      if (!workflowTypeResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message:
            "Invalid workflow type. Supported types: bike_sales, repair_process, order_fulfillment, custom_workflow",
          responseObject: null,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const serviceResponse = await workflowStepsService.resetWorkflowSteps(transaction_id, workflowTypeResult.data);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
        responseObject: null,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };
}

export const workflowStepsController = new WorkflowStepsController();
