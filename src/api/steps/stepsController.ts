import type { Request, RequestHandler, Response } from "express";

import type { CreateStepInput, UpdateStepInput } from "@/api/steps/stepsModel";
import { stepsService } from "@/api/steps/stepsService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class StepController {
  public getSteps: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      transaction_id: req.query.transaction_id as string,
      bundle_id: req.query.bundle_id as string,
      completed: req.query.completed !== undefined ? req.query.completed === "true" : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined));

    const serviceResponse = await stepsService.findAll(Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined);
    return handleServiceResponse(serviceResponse, res);
  };

  public getStep: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await stepsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createStep: RequestHandler = async (req: Request, res: Response) => {
    const stepData: CreateStepInput = {
      transaction_id: req.body.transaction_id ?? null,
      bundle_id: req.body.bundle_id ?? null,
      description: req.body.description,
      completed: req.body.completed ?? false,
      step_order: req.body.step_order !== undefined ? Number(req.body.step_order) : undefined,
    };

    const serviceResponse = await stepsService.createStep(stepData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateStep: RequestHandler = async (req: Request, res: Response) => {
    const step_id = req.params.id as string;
    const updateData: UpdateStepInput = {};

    // Only include fields that are present in the request body
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.completed !== undefined) updateData.completed = req.body.completed;
    if (req.body.step_order !== undefined) updateData.step_order = Number(req.body.step_order);

    const serviceResponse = await stepsService.updateStep(step_id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteStep: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await stepsService.deleteStep(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const stepController = new StepController();
