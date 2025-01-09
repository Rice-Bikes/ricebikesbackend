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
  summary: "Get all customers from the database",
  tags: ["Customers"],
  responses: createApiResponse(z.array(CustomerSchema), "Success"),
});

customerRouter.get("/", customerController.getCustomers);

customerRegistry.registerPath({
  method: "get",
  path: "/customers/{id}",
  summary: "Get a customer from the database based on it's uuid",
  tags: ["Customers"],
  request: { params: GetCustomerSchema.shape.params },
  responses: createApiResponse(CustomerSchema, "Success"),
});

customerRouter.get("/:id", [validateRequest(GetCustomerSchema)], customerController.getCustomer);

customerRegistry.registerPath({
  method: "post",
  path: "/customers",
  summary: "Create a customer in the database",
  tags: ["Customers"],
  request: {
    body: {
      description: "Customer object",
      content: {
        "application/json": { schema: CreateCustomerSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(CustomerSchema, "Success"),
});

customerRouter.post("/", [validateRequest(CreateCustomerSchema)], customerController.createCustomer);
