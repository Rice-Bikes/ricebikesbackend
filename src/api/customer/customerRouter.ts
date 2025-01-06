import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { customerController } from "./customerController";
import { CustomerSchema, GetCustomerSchema } from "./customerModel";

export const customerRegistry = new OpenAPIRegistry();
export const customerRouter: Router = express.Router();

customerRegistry.register("Bike", CustomerSchema);

customerRegistry.registerPath({
  method: "get",
  path: "/bikes",
  tags: ["Bike"],
  responses: createApiResponse(z.array(CustomerSchema), "Success"),
});

customerRouter.get("/", customerController.getCustomers);

customerRegistry.registerPath({
  method: "get",
  path: "/bikes/{id}",
  tags: ["Bike"],
  request: { params: GetCustomerSchema.shape.params },
  responses: createApiResponse(CustomerSchema, "Success"),
});

customerRouter.get("/:id", [validateRequest(GetCustomerSchema)], customerController.getCustomer);
