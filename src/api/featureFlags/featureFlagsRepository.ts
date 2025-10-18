import { and, desc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { featureFlags as featureFlagsTable } from "@/db/schema/featureFlags";
import { featureFlagAudit as featureFlagAuditTable } from "@/db/schema/featureFlags";

type FeatureFlag = typeof featureFlagsTable.$inferSelect;
type NewFeatureFlag = typeof featureFlagsTable.$inferInsert;

type FeatureFlagAudit = typeof featureFlagAuditTable.$inferSelect;
type NewFeatureFlagAudit = typeof featureFlagAuditTable.$inferInsert;

export class FeatureFlagsRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return this.db.select().from(featureFlagsTable);
  }

  async getFlag(flagName: string): Promise<FeatureFlag | null> {
    const rows = await this.db.select().from(featureFlagsTable).where(eq(featureFlagsTable.flag_name, flagName));

    return rows[0] ?? null;
  }

  async createFlag(data: {
    flag_name: string;
    value: boolean;
    description?: string;
    status?: string;
    updated_by: string;
  }): Promise<FeatureFlag> {
    const payload: NewFeatureFlag = {
      flag_name: data.flag_name,
      value: data.value,
      description: data.description,
      status: data.status ?? "active",
      updated_by: data.updated_by,
      // created_at and updated_at default in DB
    };

    const [inserted] = await this.db.insert(featureFlagsTable).values(payload).returning();

    if (!inserted) {
      throw new Error("Failed to create feature flag");
    }

    return inserted;
  }

  async updateFlag(flagName: string, data: { value: boolean; updated_by: string }): Promise<FeatureFlag> {
    const [updated] = await this.db
      .update(featureFlagsTable)
      .set({
        value: data.value,
        updated_by: data.updated_by,
        updated_at: new Date(),
      })
      .where(eq(featureFlagsTable.flag_name, flagName))
      .returning();

    if (!updated) {
      throw new Error(`Feature flag '${flagName}' not found`);
    }

    return updated;
  }

  async getAuditLog(): Promise<FeatureFlagAudit[]> {
    return this.db.select().from(featureFlagAuditTable).orderBy(desc(featureFlagAuditTable.changed_at));
  }

  async createAudit(data: {
    flag_name: string;
    old_value: boolean | null;
    new_value: boolean;
    changed_by: string;
    reason?: string;
    details?: any;
  }): Promise<FeatureFlagAudit> {
    const payload: NewFeatureFlagAudit = {
      flag_name: data.flag_name,
      old_value: data.old_value ?? null,
      new_value: data.new_value,
      changed_by: data.changed_by,
      reason: data.reason,
      details: data.details,
      // changed_at defaults in DB
    };

    const [inserted] = await this.db.insert(featureFlagAuditTable).values(payload).returning();

    if (!inserted) {
      throw new Error("Failed to create feature flag audit entry");
    }

    return inserted;
  }
}
