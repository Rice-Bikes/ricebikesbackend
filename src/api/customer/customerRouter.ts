import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { customerController } from "./customerController";
import { CreateCustomerSchema, CustomerSchema, GetCustomerSchema } from "./customerModel";

export const customerRegistry = new OpenAPIRegistry();
export const customerRouter: Router = express.Router();

customerRegistry.register("Customer", CustomerSchema);

customerRegistry.registerPath({
  method: "get",
  path: "/customers",
  tags: ["Customer"],
  responses: createApiResponse(z.array(CustomerSchema), "Success"),
});

customerRouter.get("/", customerController.getCustomers);

customerRegistry.registerPath({
  method: "get",
  path: "/customers/{id}",
  tags: ["Customer"],
  request: { params: GetCustomerSchema.shape.params },
  responses: createApiResponse(CustomerSchema, "Success"),
});

customerRouter.get("/:id", [validateRequest(GetCustomerSchema)], customerController.getCustomer);

customerRegistry.registerPath({
  method: "post",
  path: "/customers/{id}",
  tags: ["Customer"],
  request: { params: GetCustomerSchema.shape.params },
  responses: createApiResponse(CustomerSchema, "Success"),
});

customerRouter.post("/:id", [validateRequest(CreateCustomerSchema)], customerController.getCustomer);
