/**
 * Repair Repository Implementation with Drizzle ORM
 */
import { eq, sql } from "drizzle-orm";
import { repairs } from "../../db/schema/repairs";
import type { DrizzleDB } from "../factory";
import type { Repair, RepairCreateInput, RepairRepository, RepairUpdateInput } from "../interfaces";

export class RepairRepositoryDrizzle implements RepairRepository {
  constructor(private readonly db: DrizzleDB) {}

  async findAll(): Promise<Repair[]> {
    return this.db.select().from(repairs);
  }

  async findById(id: string): Promise<Repair | null> {
    const result = await this.db.select().from(repairs).where(eq(repairs.repair_id, id));

    return result.length ? result[0] : null;
  }

  async findActive(): Promise<Repair[]> {
    return this.db.select().from(repairs).where(eq(repairs.disabled, false));
  }

  async create(data: RepairCreateInput): Promise<Repair> {
    const result = await this.db.insert(repairs).values(data).returning();

    return result[0];
  }

  async update(id: string, data: RepairUpdateInput): Promise<Repair | null> {
    const result = await this.db.update(repairs).set(data).where(eq(repairs.repair_id, id)).returning();

    return result.length ? result[0] : null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db.delete(repairs).where(eq(repairs.repair_id, id)).returning();

      return result.length > 0;
    } catch (error) {
      return false;
    }
  }

  async count(): Promise<number> {
    const result = await this.db.select({ count: sql`count(*)` }).from(repairs);

    return Number(result[0].count);
  }
}
