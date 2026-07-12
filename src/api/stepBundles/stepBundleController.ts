import type { Request, RequestHandler, Response } from "express";

import type { CreateStepBundleInput, UpdateStepBundleInput } from "@/api/stepBundles/stepBundleModel";
import { stepBundleService } from "@/api/stepBundles/stepBundleService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class StepBundleController {
  public getStepBundles: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await stepBundleService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getStepBundle: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await stepBundleService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createStepBundle: RequestHandler = async (req: Request, res: Response) => {
    const bundleData: CreateStepBundleInput = {
      name: req.body.name,
    };

    const serviceResponse = await stepBundleService.createStepBundle(bundleData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateStepBundle: RequestHandler = async (req: Request, res: Response) => {
    const bundle_id = req.params.id as string;
    const updateData: UpdateStepBundleInput = {};

    // Only include fields that are present in the request body
    if (req.body.name !== undefined) updateData.name = req.body.name;

    const serviceResponse = await stepBundleService.updateStepBundle(bundle_id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteStepBundle: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await stepBundleService.deleteStepBundle(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public applyStepBundle: RequestHandler = async (req: Request, res: Response) => {
    const bundle_id = req.params.id as string;
    const transaction_id = req.body.transaction_id as string;
    const serviceResponse = await stepBundleService.applyToTransaction(bundle_id, transaction_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const stepBundleController = new StepBundleController();
