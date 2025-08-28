import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;
export type FeatureFlagAudit = z.infer<typeof FeatureFlagAuditSchema>;

export const FeatureFlagSchema = z.object({
  flag_name: z.string(),
  value: z.boolean(),
  description: z.string().optional(),
  status: z.string().default("active"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
});

export const FeatureFlagAuditSchema = z.object({
  id: z.number(),
  flag_name: z.string(),
  old_value: z.boolean().nullable(),
  new_value: z.boolean(),
  changed_by: z.string(),
  changed_at: z.string().datetime(),
  reason: z.string().optional(),
  details: z.any().optional(),
});

export const CreateFeatureFlagSchema = z.object({
  body: z.object({
    flag_name: z.string(),
    value: z.boolean(),
    description: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const UpdateFeatureFlagSchema = z.object({
  params: z.object({ flagName: z.string() }),
  body: z.object({
    value: z.boolean(),
    reason: z.string().optional(),
    details: z.any().optional(),
  }),
});
