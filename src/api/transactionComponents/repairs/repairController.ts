import type { Request, RequestHandler, Response } from "express";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Repair } from "./repairModel";
import { repairsService } from "./repairService";

class RepairController {
  public getRepairs: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await repairsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getRepair: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await repairsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createRepair: RequestHandler = async (req: Request, res: Response) => {
    const body = req.body;
    const repair = {
      repair_id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      price: body.price,
      disabled: false,
    } as Repair;
    const serviceResponse = await repairsService.createRepair(repair);
    return handleServiceResponse(serviceResponse, res);
  };
  public updateRepair: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const body = req.body;
    const repair = {
      name: body.name,
      description: body.description,
      price: body.price,
    } as Repair;
    const serviceResponse = await repairsService.updateRepair(id, repair);
    return handleServiceResponse(serviceResponse, res);
  };
  public deleteRepair: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await repairsService.deleteRepair(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const repairController = new RepairController();
