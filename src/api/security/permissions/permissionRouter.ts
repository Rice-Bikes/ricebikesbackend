import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import requestLogger from "@/common/middleware/requestLogger";
import { validateRequest } from "@/common/utils/httpHandlers";
import { roleController } from "./permissionController";
import {
  CreatePermissionSchema,
  GetPermissionSchema,
  PatchPermissionSchema,
  PermissionSchema,
} from "./permissionModel";

export const permissionsRegistry = new OpenAPIRegistry();
export const permissionsRouter: Router = express.Router();

permissionsRegistry.register("Permission", PermissionSchema);

permissionsRegistry.registerPath({
  method: "get",
  path: "/permissions",
  summary: "Get all permissions from the database",
  tags: ["Permission"],
  responses: createApiResponse(z.array(PermissionSchema), "Success"),
});

permissionsRouter.get("/", roleController.getPermissions);

permissionsRegistry.registerPath({
  method: "get",
  path: "/permissions/{id}",
  summary: "Get a role from the database based on their rice netid",
  tags: ["Permission"],
  request: { params: GetPermissionSchema.shape.params },
  responses: createApiResponse(PermissionSchema, "Success"),
});

permissionsRouter.get("/:id", [validateRequest(GetPermissionSchema)], roleController.getPermission);

permissionsRegistry.registerPath({
  method: "post",
  path: "/permissions",
  summary: "Create a role in the database and set it to active",
  tags: ["Permission"],
  request: {
    body: {
      description: "Permission object",
      content: {
        "application/json": { schema: CreatePermissionSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(PermissionSchema, "Success"),
});

permissionsRouter.post("/", [validateRequest(CreatePermissionSchema)], roleController.createPermission);

permissionsRegistry.registerPath({
  method: "patch",
  path: "/permissions/{id}",
  summary: "Update the active status of a role in the database (wip)",
  tags: ["Permission"],
  request: {
    params: PatchPermissionSchema.shape.params,
  },
  responses: createApiResponse(PermissionSchema, "Success"),
});

permissionsRouter.patch(
  "/:id",
  [requestLogger[1], validateRequest(CreatePermissionSchema)],
  roleController.updatePermission,
);

permissionsRegistry.registerPath({
  method: "delete",
  path: "/permissions/{id}",
  summary: "Delete a role from the database based on their rice netid",
  tags: ["Permission"],
  request: { params: GetPermissionSchema.shape.params },
  responses: createApiResponse(PermissionSchema, "Success"),
});
permissionsRouter.delete("/:id", [requestLogger[1]], roleController.deletePermission);
