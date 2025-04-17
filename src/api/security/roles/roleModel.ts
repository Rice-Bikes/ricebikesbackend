import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Role = z.infer<typeof RoleSchema>;
export type RoleUser = z.infer<typeof RoleUserSchema>;
export type RolePermissions = z.infer<typeof RolePermissionsSchema>;

export const RoleSchema = z.object({
  role_id: z.string().uuid(),
  name: z.string(),
  disabled: z.boolean(),
  description: z.string().nullable(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetRoleSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const CreateRoleSchema = z.object({
  body: z.object({
    name: z.string(),
    disabled: z.boolean(),
    description: z.string().nullable(),
  }),
});

export const PatchRoleSchema = z.object({
  params: z.object({ id: commonValidations.uuid }),
  body: z.object({
    name: z.string(),
    disabled: z.boolean(),
    description: z.string().nullable(),
  }),
});

export const RoleUserSchema = z.object({
  user_id: z.string().uuid(),
  role_id: z.string().uuid(),
  Role: RoleSchema.optional(),
});

export const RolePermissionsSchema = z.object({
  role_id: z.string().uuid(),
  permission_id: z.string().uuid(),
  Permission: z
    .object({
      permission_id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
    })
    .optional(),
});
