import { relations } from "drizzle-orm";
import { boolean, integer, json, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const featureFlags = pgTable("FeatureFlags", {
  flag_name: varchar("flag_name").primaryKey(),
  value: boolean("value").notNull(),
  description: varchar("description"),
  status: varchar("status", { length: 32 }).default("active"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  updated_by: varchar("updated_by").notNull(),
});

export const featureFlagAudit = pgTable("FeatureFlagAudit", {
  id: serial("id").primaryKey(),
  flag_name: varchar("flag_name").notNull(),
  old_value: boolean("old_value"),
  new_value: boolean("new_value"),
  changed_by: varchar("changed_by").notNull(),
  changed_at: timestamp("changed_at").defaultNow().notNull(),
  reason: varchar("reason"),
  details: json("details"),
});

export const featureFlagsRelations = relations(featureFlags, () => ({}));
export const featureFlagAuditRelations = relations(featureFlagAudit, () => ({}));
