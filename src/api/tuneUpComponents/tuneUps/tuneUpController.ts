import type { Request, RequestHandler, Response } from "express";

import type { CreateTuneUpInput, UpdateTuneUpInput } from "@/api/tuneUpComponents/tuneUps/tuneUpModel";
import { tuneUpService } from "@/api/tuneUpComponents/tuneUps/tuneUpService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class TuneUpController {
  public getTuneUps: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await tuneUpService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getTuneUp: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await tuneUpService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTuneUp: RequestHandler = async (req: Request, res: Response) => {
    const tuneUpData: CreateTuneUpInput = {
      name: req.body.name,
      cost: Number(req.body.cost),
    };

    const serviceResponse = await tuneUpService.createTuneUp(tuneUpData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateTuneUp: RequestHandler = async (req: Request, res: Response) => {
    const tune_up_id = req.params.id as string;
    const updateData: UpdateTuneUpInput = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.cost !== undefined) updateData.cost = Number(req.body.cost);

    const serviceResponse = await tuneUpService.updateTuneUp(tune_up_id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteTuneUp: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await tuneUpService.deleteTuneUp(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public applyTuneUp: RequestHandler = async (req: Request, res: Response) => {
    const tune_up_id = req.params.id as string;
    const transaction_id = req.body.transaction_id as string;
    const changed_by = req.body.changed_by as string;
    const serviceResponse = await tuneUpService.applyToTransaction(tune_up_id, changed_by, transaction_id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const tuneUpController = new TuneUpController();
