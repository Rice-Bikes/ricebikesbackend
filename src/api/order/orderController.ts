import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";
import type { Request, RequestHandler, Response } from "express";
import type { Order } from "./orderModel";
import { orderService } from "./orderService";

class OrderController {
  public getOrders: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await orderService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getNextOrderAfterDate: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await orderService.findClosestFutureOrder();
    return handleServiceResponse(serviceResponse, res);
  };

  public getOrder: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await orderService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };

  public createOrder: RequestHandler = async (req: Request, res: Response) => {
    const orderData = {
      supplier: req.body.supplier as string,
      ordered_by: req.body.ordered_by as string,
      order_date: req.body.order_date ? new Date(req.body.order_date) : new Date(),
      estimated_delivery: req.body.estimated_delivery ? new Date(req.body.estimated_delivery) : undefined,
    };
    logger.debug("Creating order:", orderData);
    const serviceResponse = await orderService.createOrder(orderData);
    return handleServiceResponse(serviceResponse, res);
  };

  public updateOrder: RequestHandler = async (req: Request, res: Response) => {
    const orderData = {
      ...req.body,
    } as Order;
    const serviceResponse = await orderService.updateOrder(orderData);
    return handleServiceResponse(serviceResponse, res);
  };

  public deleteOrder: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await orderService.deleteOrder(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

const orderController = new OrderController();

export default orderController;
