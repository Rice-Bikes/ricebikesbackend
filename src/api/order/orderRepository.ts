import type { Order } from "@/api/order/orderModel";
import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { orders as ordersTable } from "@/db/schema/orders";
import { asc, eq, gte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export class OrderRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(db = drizzleDb) {
    this.db = db;
  }

  async findAll(): Promise<Order[]> {
    try {
      const results = await this.db.select().from(ordersTable);
      return results as Order[];
    } catch (error) {
      logger.error(`[OrderRepository] findAll error: ${error}`);
      throw error;
    }
  }

  async findClosestFutureOrder(): Promise<Order | null> {
    try {
      const now = new Date();
      const result = await this.db
        .select()
        .from(ordersTable)
        .where(gte(ordersTable.order_date, now))
        .orderBy(asc(ordersTable.order_date))
        .limit(1);

      return result.length > 0 ? (result[0] as Order) : null;
    } catch (error) {
      logger.error(`[OrderRepository] findClosestFutureOrder error: ${error}`);
      throw error;
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    try {
      const result = await this.db.select().from(ordersTable).where(eq(ordersTable.order_id, orderId)).limit(1);
      return result.length > 0 ? (result[0] as Order) : null;
    } catch (error) {
      logger.error(`[OrderRepository] findById error: ${error}`);
      throw error;
    }
  }

  async create(data: {
    supplier: string;
    ordered_by: string;
    order_date?: Date;
    estimated_delivery?: Date;
  }): Promise<Order> {
    try {
      const order_date = data.order_date || new Date();
      const estimated_delivery = data.estimated_delivery || new Date(order_date.getTime() + 5 * 24 * 60 * 60 * 1000);

      const [inserted] = await this.db
        .insert(ordersTable)
        .values({
          supplier: data.supplier,
          ordered_by: data.ordered_by,
          order_date,
          estimated_delivery,
        })
        .returning();

      return inserted as Order;
    } catch (error) {
      logger.error(`[OrderRepository] create error: ${error}`);
      throw error;
    }
  }

  async update(
    orderId: string,
    data: {
      supplier?: string;
      ordered_by?: string;
      order_date?: Date;
      estimated_delivery?: Date;
    },
  ): Promise<Order> {
    try {
      const updated = await this.db
        .update(ordersTable)
        .set({
          ...(data.supplier !== undefined ? { supplier: data.supplier } : {}),
          ...(data.ordered_by !== undefined ? { ordered_by: data.ordered_by } : {}),
          ...(data.order_date !== undefined ? { order_date: data.order_date } : {}),
          ...(data.estimated_delivery !== undefined ? { estimated_delivery: data.estimated_delivery } : {}),
        })
        .where(eq(ordersTable.order_id, orderId))
        .returning();

      if (updated.length === 0) {
        throw new Error(`Order with ID ${orderId} not found`);
      }

      return updated[0] as Order;
    } catch (error) {
      logger.error(`[OrderRepository] update error: ${error}`);
      throw error;
    }
  }

  async delete(orderId: string): Promise<Order | null> {
    try {
      const deleted = await this.db.delete(ordersTable).where(eq(ordersTable.order_id, orderId)).returning();
      return deleted.length > 0 ? (deleted[0] as Order) : null;
    } catch (error) {
      logger.error(`[OrderRepository] delete error: ${error}`);
      throw error;
    }
  }
}
