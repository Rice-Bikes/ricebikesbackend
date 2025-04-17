import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";
import { PermissionSchema } from "../permissions/permissionModel";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  active: z.boolean(),
  permissions: z.array(PermissionSchema).optional(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const CreateUserSchema = z.object({
  body: z.object({
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    active: z.boolean(),
  }),
});

export const PatchUserSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    active: z.boolean(),
  }),
});

export const UserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
});
