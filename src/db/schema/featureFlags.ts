import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const featureFlags = pgTable("feature_flags", {
  flag_name: varchar("flag_name").primaryKey(),
  value: boolean("value").notNull(),
  description: varchar("description"),
  status: varchar("status", { length: 32 }).default("active"),
  created_at: timestamp("created_at", { precision: 6 }).defaultNow(),
  updated_at: timestamp("updated_at", { precision: 6 }).defaultNow(),
  updated_by: varchar("updated_by").notNull(),
});

export const featureFlagAudit = pgTable("feature_flag_audit", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  flag_name: varchar("flag_name").notNull(),
  old_value: boolean("old_value"),
  new_value: boolean("new_value"),
  changed_by: varchar("changed_by").notNull(),
  changed_at: timestamp("changed_at", { precision: 6 }).defaultNow(),
  reason: varchar("reason"),
  details: jsonb("details"),
});

export const featureFlagsRelations = relations(featureFlags, () => ({}));
export const featureFlagAuditRelations = relations(featureFlagAudit, () => ({}));
