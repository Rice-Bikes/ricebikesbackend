import type { Request, RequestHandler, Response } from "express";

import { customersService } from "@/api/customer/customerService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class CustomerController {
  public getCustomers: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await customersService.findAll();
    return handleServiceResponse(serviceResponse, res);
  };

  public getCustomer: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const serviceResponse = await customersService.findById(id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const customerController = new CustomerController();
