import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Permission = z.infer<typeof PermissionSchema>;

export const PermissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetPermissionSchema = z.object({
  params: z.object({ id: z.number() }),
});

export const CreatePermissionSchema = z.object({
  body: z.object({
    name: z.string(),
    description: z.string(),
  }),
});

export const PatchPermissionSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    name: z.string(),
    description: z.string(),
  }),
});
