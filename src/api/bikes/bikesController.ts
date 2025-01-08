import type { Request, RequestHandler, Response } from "express";

import { type Bike, CreateBikeSchema } from "@/api/bikes/bikesModel";
import { bikesService } from "@/api/bikes/bikesService";
import { handleServiceResponse, validateRequest } from "@/common/utils/httpHandlers";

class BikeController {
  public getBikes: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await bikesService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getBike: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await bikesService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createBike: RequestHandler = async (req: Request, res: Response) => {
    const bike = {
      bike_id: crypto.randomUUID(),
      make: req.body.make,
      model: req.body.model,
      description: req.body.description,
      date_created: new Date(),
    } as Bike;
    const serviceResponse = await bikesService.createBike(bike);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const bikeController = new BikeController();
