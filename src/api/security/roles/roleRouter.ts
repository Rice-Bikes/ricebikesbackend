import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import requestLogger from "@/common/middleware/requestLogger";
import { validateRequest } from "@/common/utils/httpHandlers";
import { roleController } from "./roleController";
import { CreateRoleSchema, GetRoleSchema, PatchRoleSchema, RoleSchema } from "./roleModel";

export const roleRegistry = new OpenAPIRegistry();
export const roleRouter: Router = express.Router();

roleRegistry.register("Role", RoleSchema);

roleRegistry.registerPath({
  method: "get",
  path: "/roles",
  summary: "Get all roles from the database",
  tags: ["Role"],
  responses: createApiResponse(z.array(RoleSchema), "Success"),
});

roleRouter.get("/", roleController.getRoles);

roleRegistry.registerPath({
  method: "get",
  path: "/roles/{id}",
  summary: "Get a role from the database based on their rice netid",
  tags: ["Role"],
  request: { params: GetRoleSchema.shape.params },
  responses: createApiResponse(RoleSchema, "Success"),
});

roleRouter.get("/:id", [validateRequest(GetRoleSchema)], roleController.getRole);

roleRegistry.registerPath({
  method: "post",
  path: "/roles",
  summary: "Create a role in the database and set it to active",
  tags: ["Role"],
  request: {
    body: {
      description: "Role object",
      content: {
        "application/json": { schema: CreateRoleSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(RoleSchema, "Success"),
});

roleRouter.post("/", [validateRequest(CreateRoleSchema)], roleController.createRole);

roleRegistry.registerPath({
  method: "patch",
  path: "/roles/{id}",
  summary: "Update the active status of a role in the database (wip)",
  tags: ["Role"],
  request: {
    params: PatchRoleSchema.shape.params,
  },
  responses: createApiResponse(RoleSchema, "Success"),
});

roleRouter.patch("/:id", [requestLogger[1], validateRequest(CreateRoleSchema)], roleController.updateRole);

roleRegistry.registerPath({
  method: "delete",
  path: "/roles/{id}",
  summary: "Delete a role from the database based on their rice netid",
  tags: ["Role"],
  request: { params: GetRoleSchema.shape.params },
  responses: createApiResponse(RoleSchema, "Success"),
});
roleRouter.delete("/:id", [requestLogger[1], validateRequest(GetRoleSchema)], roleController.deleteRole);
