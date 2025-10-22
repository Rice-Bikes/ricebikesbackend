/**
 * Repair Repository - Drizzle Implementation
 *
 * This file implements the Repair repository interface using Drizzle ORM.
 */

import { and, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidv4 } from "uuid";

import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { repairs as repairsTable } from "@/db/schema/repairs";
import { transactions as transactionsTable } from "@/db/schema/transactions";
import type { CreateRepairInput, Repair, UpdateRepairInput } from "./repairModel";
import type { RepairRepository } from "./types";

export class RepairRepositoryDrizzle implements RepairRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  async findAll(): Promise<Repair[]> {
    try {
      const query = this.db
        .select({
          repair: repairsTable,
        })
        .from(repairsTable)
        .where(eq(repairsTable.disabled, false));

      const results = await query.execute();

      return results.map((row) => this.mapToRepair(row));
    } catch (error) {
      logger.error(`Error finding all repairs: ${error}`);
      throw error;
    }
  }

  async findById(id: string): Promise<Repair | null> {
    try {
      const results = await this.db
        .select({
          repair: repairsTable,
        })
        .from(repairsTable)
        .where(eq(repairsTable.repair_id, id));

      if (results.length === 0) {
        return null;
      }

      return this.mapToRepair(results[0]);
    } catch (error) {
      logger.error(`Error finding repair by ID: ${error}`);
      throw error;
    }
  }

  async create(repairData: CreateRepairInput): Promise<Repair> {
    try {
      const newId = uuidv4();
      const now = new Date();

      await this.db.insert(repairsTable).values({
        description: repairData.description,
        price: repairData.price || 0,
        disabled: repairData.disabled,
        name: repairData.name,
      });

      const repair = await this.findById(newId);
      if (!repair) {
        throw new Error("Failed to retrieve created repair");
      }

      return repair;
    } catch (error) {
      logger.error(`Error creating repair: ${error}`);
      throw error;
    }
  }

  async update(id: string, updateData: UpdateRepairInput): Promise<Repair | null> {
    try {
      // First check if repair exists
      const existingRepair = await this.findById(id);
      if (!existingRepair) {
        return null;
      }

      await this.db
        .update(repairsTable)
        .set({
          description: updateData.description ?? existingRepair.description,
          price: updateData.price ?? existingRepair.price,
          name: updateData.name ?? existingRepair.name,
          disabled: updateData.disabled ?? existingRepair.disabled,
        })
        .where(eq(repairsTable.repair_id, id));

      return this.findById(id);
    } catch (error) {
      logger.error(`Error updating repair: ${error}`);
      throw error;
    }
  }

  async delete(id: string): Promise<Repair | null> {
    try {
      // First get the repair to return
      const repair = await this.findById(id);
      if (!repair) {
        return null;
      }

      // Delete the repair
      await this.db.delete(repairsTable).where(eq(repairsTable.repair_id, id));

      return repair;
    } catch (error) {
      logger.error(`Error deleting repair: ${error}`);
      throw error;
    }
  }

  // Helper method to map database results to Repair model
  private mapToRepair(row: any): Repair {
    return {
      repair_id: row.repair.repair_id,
      name: row.repair.name,
      description: row.repair.description,
      price: row.repair.price,
      disabled: row.repair.disabled,
    };
  }

  // Legacy method aliases for backward compatibility
  async findAllAsync(): Promise<Repair[]> {
    return this.findAll();
  }

  async findByIdAsync(id: string): Promise<Repair | null> {
    return this.findById(id);
  }
}
