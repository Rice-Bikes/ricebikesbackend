import type { Request, RequestHandler, Response } from "express";
import { Router } from "express";
import multer from "multer";

import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { Or } from "@prisma/client/runtime/library";
import { orderRequestsService } from "./orderRequestService";
import type { CreateOrderRequests, OrderRequest } from "./orderRequestsModel";

const upload = multer();
const router = Router();

class OrderRequestsController {
  public getOrderRequestss: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await orderRequestsService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getOrderRequests: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await orderRequestsService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createOrderRequests: RequestHandler = async (req: Request, res: Response) => {
    // const body = req.body;
    const orderRequests = {
      ...req.body,
      date_created: new Date(),
    } as OrderRequest;
    const serviceResponse = await orderRequestsService.createOrderRequest(orderRequests);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateOrderRequests: RequestHandler = async (req: Request, res: Response) => {
    const orderRequests = {
      ...req.body,
    } as OrderRequest;
    const serviceResponse = await orderRequestsService.updateOrderRequest(orderRequests);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteOrderRequests: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.request_id as string;
    const serviceResponse = await orderRequestsService.deleteOrderRequest(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public processOrderPdf: RequestHandler = async (req: Request, res: Response) => {
    try {
      console.log("req.file", req.file);
      if (!req.file?.buffer) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }
      const result = await orderRequestsService.extractText(req.file.buffer);
      return res.json(result);
    } catch (error) {
      console.error("Error processing PDF:", error);
      return res.status(500).json({ message: "Error processing PDF" });
    }
  };
}

const orderRequestsController = new OrderRequestsController();

export default orderRequestsController;
