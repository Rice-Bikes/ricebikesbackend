import type { Request, RequestHandler, Response } from "express";

import { bikesService } from "@/api/bikes/bikesService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

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
}

export const bikeController = new BikeController();
