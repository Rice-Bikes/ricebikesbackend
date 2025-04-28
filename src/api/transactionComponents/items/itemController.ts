import type { Request, RequestHandler, Response } from "express";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";
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
      stock: body.stock,
      minimum_stock: body.minimum_stock,
      standard_price: body.standard_price,
      wholesale_cost: body.wholesale_cost,
      condition: body.condition,
      disabled: false, // assume that it is not disabled on creation lol
      managed: body.managed, // not sure what this does honestly (going to change into qbp vs created )
      category_1: body.category_1,
      category_2: body.category_2,
      category_3: body.category_3,
      specifications: body.specifications, // Assuming JSON can be any valid JSON
      features: body.features, // Assuming JSON can be any valid JSON
    } as Item;
    const serviceResponse = await itemsService.createItem(item);
    return handleServiceResponse(serviceResponse, res);
  };

  public enableItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await itemsService.enableItem(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public refreshCatalog: RequestHandler = async (req: Request, res: Response) => {
    console.log("catalog request body", req.body);
    const csv = req.body.csv as string;
    const serviceResponse = await itemsService.refreshItems(csv);
    return handleServiceResponse(serviceResponse, res);
  };

  public getCategories: RequestHandler = async (req: Request, res: Response) => {
    logger.info(`Getting items for category ${req.query.category}`);
    console.log("category", req.query.category);

    const categoryParam = req.params.category || req.query.category;
    if (!categoryParam) {
      return handleServiceResponse(
        {
          success: false,
          message: "Category parameter is required",
          statusCode: 400,
          responseObject: undefined,
        },
        res,
      );
    }

    const category = Number.parseInt(categoryParam as string);
    if (Number.isNaN(category) || category < 1 || category > 3) {
      return handleServiceResponse(
        {
          success: false,
          message: "Invalid category number",
          statusCode: 400,
          responseObject: undefined,
        },
        res,
      );
    }
    logger.info(`Getting items for category ${category}`);
    const serviceResponse = await itemsService.getCategory(category);
    return handleServiceResponse(serviceResponse, res);
  };
  public deleteItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await itemsService.deleteItem(id);
    return handleServiceResponse(serviceResponse, res);
  };
  public updateItem: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const body = req.body;
    const item = {
      upc: body.upc,
      name: body.name,
      description: body.description,
      brand: body.brand,
      stock: body.stock,
      minimum_stock: body.minimum_stock,
      standard_price: body.standard_price,
      wholesale_cost: body.wholesale_cost,
      condition: body.condition,
      disabled: false, // assume that it is not disabled on creation lol
      managed: body.managed, // not sure what this does honestly (going to change into qbp vs created )
      category_1: body.category_1,
      category_2: body.category_2,
      category_3: body.category_3,
      specifications: body.specifications, // Assuming JSON can be any valid JSON
      features: body.features, // Assuming JSON can be any valid JSON
    } as Item;
    const serviceResponse = await itemsService.updateItem(item);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const itemController = new ItemController();
