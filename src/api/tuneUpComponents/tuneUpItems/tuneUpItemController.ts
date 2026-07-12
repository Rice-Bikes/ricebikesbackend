import type { Request, RequestHandler, Response } from "express";

import type { CreateTuneUpItemInput, UpdateTuneUpItemInput } from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemModel";
import { tuneUpItemService } from "@/api/tuneUpComponents/tuneUpItems/tuneUpItemService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class TuneUpItemController {
  public getTuneUpItems: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      tune_up_id: req.query.tune_up_id as string,
      repair_id: req.query.repair_id as string,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined));

    const serviceResponse = await tuneUpItemService.findAll(
      Object.keys(cleanFilters).length > 0 ? cleanFilters : undefined,
    );
    return handleServiceResponse(serviceResponse, res);
  };

  public getTuneUpItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await tuneUpItemService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createTuneUpItem: RequestHandler = async (req: Request, res: Response) => {
    const itemData: CreateTuneUpItemInput = {
      tune_up_id: req.body.tune_up_id,
      repair_id: req.body.repair_id,
    };

    const serviceResponse = await tuneUpItemService.createTuneUpItem(itemData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateTuneUpItem: RequestHandler = async (req: Request, res: Response) => {
    const tune_up_item_id = req.params.id as string;
    const updateData: UpdateTuneUpItemInput = {};

    if (req.body.repair_id !== undefined) updateData.repair_id = req.body.repair_id;

    const serviceResponse = await tuneUpItemService.updateTuneUpItem(tune_up_item_id, updateData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteTuneUpItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await tuneUpItemService.deleteTuneUpItem(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const tuneUpItemController = new TuneUpItemController();
