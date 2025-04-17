import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import requestLogger from "@/common/middleware/requestLogger";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./userController";
import { CreateUserSchema, GetUserSchema, PatchUserSchema, UserSchema } from "./userModel";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register("User", UserSchema);

userRegistry.registerPath({
  method: "get",
  path: "/users",
  summary: "Get all users from the database",
  tags: ["User"],
  responses: createApiResponse(z.array(UserSchema), "Success"),
});

userRouter.get("/", userController.getUsers);

userRouter.post("/roles", userController.attachRoleToUser);

userRouter.delete("/roles", userController.detachRoleFromUser);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  summary: "Get a user from the database based on their rice netid",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.get("/:id", [validateRequest(GetUserSchema)], userController.getUser);

userRegistry.registerPath({
  method: "post",
  path: "/users",
  summary: "Create a user in the database and set it to active",
  tags: ["User"],
  request: {
    body: {
      description: "User object",
      content: {
        "application/json": { schema: CreateUserSchema.shape.body },
      },
    },
  },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.post("/", [validateRequest(CreateUserSchema)], userController.createUser);

userRegistry.registerPath({
  method: "patch",
  path: "/users/{id}",
  summary: "Update the active status of a user in the database (wip)",
  tags: ["User"],
  request: {
    params: PatchUserSchema.shape.params,
  },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.patch("/:id", [requestLogger[1], validateRequest(CreateUserSchema)], userController.updateUser);

userRegistry.registerPath({
  method: "delete",
  path: "/users/{id}",
  summary: "Delete a user from the database based on their rice netid",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, "Success"),
});
userRouter.delete("/:id", [requestLogger[1], validateRequest(GetUserSchema)], userController.deleteUser);
