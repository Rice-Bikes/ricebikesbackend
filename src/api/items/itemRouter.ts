import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { itemController } from "./itemController";
import { CreateItemSchema, GetItemSchema, ItemSchema, PatchItemsSchema, getCategoriesSchema } from "./itemModel";

export const itemRegistry = new OpenAPIRegistry();
export const itemRouter: Router = express.Router();

itemRegistry.register("Item", ItemSchema);

itemRegistry.registerPath({
  method: "get",
  path: "/items",
  summary: "Get all items from the database",
  tags: ["Items"],
  responses: createApiResponse(z.array(ItemSchema), "Success"),
});

itemRouter.get("/", itemController.getItems);

itemRegistry.registerPath({
  method: "post",
  path: "/items",
  summary: "Create a item in the database",
  tags: ["Items"],
  request: {
    body: {
      description: "Item object",
      content: {
        "application/json": { schema: CreateItemSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ItemSchema, "Success"),
});

itemRouter.post("/", [validateRequest(CreateItemSchema)], itemController.createItem);

itemRegistry.registerPath({
  method: "patch",
  path: "/items",
  summary: "Update items in the database",
  tags: ["Items"],
  request: {
    body: {
      description: "Item object",
      content: {
        "text/plain": { schema: PatchItemsSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ItemSchema, "Success"),
});
itemRouter.patch("/", itemController.refreshCatalog);

itemRegistry.registerPath({
  method: "patch",
  path: "/items/{id}",
  summary: "Update items in the database",
  tags: ["Items"],
  request: {
    body: {
      description: "Item object",
      content: {
        "text/plain": { schema: PatchItemsSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(ItemSchema, "Success"),
});
itemRouter.patch("/:id", itemController.enableItem);

itemRegistry.registerPath({
  method: "get",
  path: "/items/categories/",
  summary: "Get all unique categories in the database",
  tags: ["Items"],
  request: getCategoriesSchema.shape,
  responses: createApiResponse(ItemSchema, "Success"),
});

itemRouter.get("/categories/", itemController.getCategories);

itemRegistry.registerPath({
  method: "get",
  path: "/items/{id}",
  summary: "Get a item from the database based on it's uuid",
  tags: ["Items"],
  request: { params: GetItemSchema.shape.params },
  responses: createApiResponse(ItemSchema, "Success"),
});

itemRouter.get("/:id", [validateRequest(GetItemSchema)], itemController.getItem);
