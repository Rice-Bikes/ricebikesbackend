import type { Request, RequestHandler, Response } from "express";

import { customersService } from "@/api/customer/customerService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import type { Customer } from "./customerModel";

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

  public createCustomer: RequestHandler = async (req: Request, res: Response) => {
    const body = req.body;
    const customer = {
      customer_id: crypto.randomUUID(),
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
    } as Customer;
    const serviceResponse = await customersService.createCustomer(customer);
    return handleServiceResponse(serviceResponse, res);
  };

  public emailCustomer: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id);
    const body = req.body;
    const serviceResponse = await customersService.sendEmail(body.customer as Customer, id);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const customerController = new CustomerController();
