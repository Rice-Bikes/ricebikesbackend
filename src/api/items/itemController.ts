import type { Request, RequestHandler, Response } from "express";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Item } from "./itemModel";
import { itemsService } from "./itemService";

class ItemController {
  public getItems: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await itemsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await itemsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createItem: RequestHandler = async (req: Request, res: Response) => {
    const body = req.body;
    const item = {
      upc: body.upc,
      name: body.name,
      description: body.description,
      brand: body.brand,
      stock: 0,
      minimum_stock: body.minimum_stock,
      standard_price: body.standard_price,
      wholesale_cost: body.wholesale_cost,
      condition: body.condition,
      disabled: false, // assume that it is not disabled on creation lol
      managed: body.managed, // not sure what this does honestly
      category_1: body.category_1,
      category_2: body.category_2,
      category_3: body.category_3,
      specifications: body.specifications, // Assuming JSON can be any valid JSON
      features: body.features, // Assuming JSON can be any valid JSON
    } as Item;
    const serviceResponse = await itemsService.createItem(item);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const itemController = new ItemController();
