import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;

export const UserSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  active: z.boolean(),
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
