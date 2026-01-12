import { serviceLogger as logger } from "@/common/utils/logger";
import { db as drizzleDb } from "@/db/client";
import type * as schema from "@/db/schema";
import { items as itemsTable } from "@/db/schema/items";
import { transactions as transactionsTable } from "@/db/schema/transactions";
import { orderRequests as orderRequestsTable } from "@/db/schema/transactions";
import { users as usersTable } from "@/db/schema/users";
import { asc, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import pdfParse from "pdf-parse";

import type { AggOrderRequest, CreateOrderRequests, OrderRequest } from "./orderRequestsModel";

export class OrderRequestsRepository {
  private db: PostgresJsDatabase<typeof schema>;

  constructor(dbInstance = drizzleDb) {
    this.db = dbInstance;
  }

  /**
   * Map a DB record to the OrderRequest model
   */
  private mapToOrderRequest(record: any): OrderRequest {
    if (!record) {
      throw new Error("Cannot map null or undefined record to OrderRequest");
    }

    return {
      order_request_id: record.order_request_id,
      created_by: record.created_by,
      transaction_id: record.transaction_id,
      item_id: record.item_id,
      date_created: record.date_created instanceof Date ? record.date_created : new Date(record.date_created),
      quantity: Number(record.quantity),
      notes: record.notes ?? null,
      ordered: Boolean(record.ordered),
    };
  }

  /**
   * Parse value as Date
   */
  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return new Date();
    }
    return d;
  }

  /**
   * Validate whether a string is a UUID
   */
  private isUuid(value: string): boolean {
    if (!value || typeof value !== "string") return false;
    // Basic UUID v4/v1/v3/v5 format check (case-insensitive)
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * Get all order requests
   */
  async findAllAsync(): Promise<AggOrderRequest[]> {
    try {
      const rows = await this.db
        .select({
          orderRequest: orderRequestsTable,
          Item: itemsTable,
          User: usersTable,
        })
        .from(orderRequestsTable)
        .innerJoin(itemsTable, eq(orderRequestsTable.item_id, itemsTable.item_id))
        .innerJoin(usersTable, eq(orderRequestsTable.created_by, usersTable.user_id))
        .orderBy(asc(orderRequestsTable.date_created));

      const result: AggOrderRequest[] = rows.map(({ orderRequest, Item, User }) => ({
        order_request_id: orderRequest.order_request_id,
        created_by: orderRequest.created_by,
        transaction_id: orderRequest.transaction_id,
        item_id: orderRequest.item_id,
        date_created: orderRequest.date_created,
        quantity: Number(orderRequest.quantity),
        notes: orderRequest.notes ?? null,
        ordered: Boolean(orderRequest.ordered),
        Item,
        User,
      }));

      return result;
    } catch (error) {
      logger.error({ error }, "[OrderRequestsRepository] findAllAsync error");
      throw error;
    }
  }

  /**
   * Get order requests with aggregated Item and User by transaction_id
   * Accepts either a UUID `transaction_id` or a numeric `transaction_num` (e.g., "123")
   */
  async findByIdAgg(transaction_id: string): Promise<AggOrderRequest[] | null> {
    try {
      if (!transaction_id || transaction_id.trim() === "") {
        logger.warn({ transaction_id }, "[OrderRequestsRepository] findByIdAgg called with empty transaction_id");
        return null;
      }

      const tid = transaction_id.trim();

      // Determine whether tid is a UUID or a numeric transaction number
      let txUuid!: string;

      if (this.isUuid(tid)) {
        txUuid = tid;
      } else if (/^\d+$/.test(tid)) {
        // If a numeric transaction number was passed, look up the corresponding UUID
        const txRows = await this.db
          .select()
          .from(transactionsTable)
          .where(eq(transactionsTable.transaction_num, Number(tid)));

        if (!txRows || txRows.length === 0) {
          // No transaction found with that numeric id -> no order requests
          return [];
        }

        txUuid = (txRows[0] as any).transaction_id;
      } else {
        // Unrecognized format - bail out safely with empty result
        logger.warn(
          { transaction_id: tid },
          "[OrderRequestsRepository] findByIdAgg called with non-UUID, non-numeric transaction_id",
        );
        return [];
      }

      const rows = await this.db
        .select({
          orderRequest: orderRequestsTable,
          Item: itemsTable,
          User: usersTable,
        })
        .from(orderRequestsTable)
        .innerJoin(itemsTable, eq(orderRequestsTable.item_id, itemsTable.item_id))
        .innerJoin(usersTable, eq(orderRequestsTable.created_by, usersTable.user_id))
        .where(eq(orderRequestsTable.transaction_id, txUuid));

      if (rows.length === 0) return [];

      const result: AggOrderRequest[] = rows.map(({ orderRequest, Item, User }) => ({
        order_request_id: orderRequest.order_request_id,
        created_by: orderRequest.created_by,
        transaction_id: orderRequest.transaction_id,
        item_id: orderRequest.item_id,
        date_created: orderRequest.date_created,
        quantity: Number(orderRequest.quantity),
        notes: orderRequest.notes ?? null,
        ordered: Boolean(orderRequest.ordered),
        Item,
        User,
      }));

      return result;
    } catch (error) {
      logger.error({ error, transaction_id }, "[OrderRequestsRepository] findByIdAgg error");
      throw error;
    }
  }

  /**
   * Create a new order request
   * - Ensures ordered defaults to false
   * - Sets date_created when not provided
   * - order_request_id is generated by DB default if not provided
   */
  async create(orderRequest: Partial<OrderRequest> | CreateOrderRequests): Promise<OrderRequest> {
    try {
      // Normalize input: support both Partial&lt;OrderRequest&gt; and CreateOrderRequests (with body)
      const isCreateOrderRequests = (val: unknown): val is CreateOrderRequests => {
        return (
          !!val &&
          typeof val === "object" &&
          "body" in (val as Record<string, unknown>) &&
          !!(val as any).body &&
          typeof (val as any).body === "object"
        );
      };

      let body: CreateOrderRequests["body"];
      let meta: Partial<OrderRequest> = {};

      if (isCreateOrderRequests(orderRequest)) {
        body = orderRequest.body;
      } else {
        const o = orderRequest as Partial<OrderRequest>;

        // Ensure required fields exist when not using the { body } wrapper
        if (!o.created_by || !o.transaction_id || !o.item_id || o.quantity === undefined || o.quantity === null) {
          throw new Error("Missing required fields: created_by, transaction_id, item_id, quantity");
        }

        body = {
          created_by: o.created_by,
          transaction_id: o.transaction_id,
          item_id: o.item_id,
          quantity: o.quantity,
          notes: o.notes ?? null,
        };
        meta = o;
      }

      const values = {
        order_request_id: meta.order_request_id, // optional; DB can generate
        created_by: body.created_by,
        transaction_id: body.transaction_id,
        item_id: body.item_id,
        date_created: meta.date_created ? this.toDate(meta.date_created) : new Date(),
        quantity: Number(body.quantity),
        notes: body.notes ?? null,
        ordered: meta.ordered ?? false,
      };

      // Remove undefined fields to let DB defaults apply (e.g., order_request_id)
      const cleanValues = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== undefined));

      const inserted = await this.db
        .insert(orderRequestsTable)
        .values(cleanValues as any)
        .returning();

      if (inserted.length === 0) {
        throw new Error("Failed to insert OrderRequest");
      }

      return this.mapToOrderRequest(inserted[0]);
    } catch (error) {
      logger.error({ error, orderRequest }, "[OrderRequestsRepository] create error");
      throw error;
    }
  }

  /**
   * Update  xisting order request
   */
  async update(orderRequest: OrderRequest): Promise<OrderRequest> {
    try {
      const updateData = {
        created_by: orderRequest.created_by,
        transaction_id: orderRequest.transaction_id,
        item_id: orderRequest.item_id,
        date_created: this.toDate(orderRequest.date_created),
        quantity: Number(orderRequest.quantity),
        notes: orderRequest.notes ?? null,
        ordered: Boolean(orderRequest.ordered),
      };

      const updated = await this.db
        .update(orderRequestsTable)
        .set(updateData)
        .where(eq(orderRequestsTable.order_request_id, orderRequest.order_request_id))
        .returning();

      if (updated.length === 0) {
        throw new Error(`OrderRequest with ID ${orderRequest.order_request_id} not found`);
      }

      return this.mapToOrderRequest(updated[0]);
    } catch (error) {
      logger.error({ error, orderRequest }, "[OrderRequestsRepository] update error");
      throw error;
    }
  }

  /**
   * Delete an order request by id
   */
  async delete(order_request_id: string): Promise<OrderRequest> {
    try {
      const deleted = await this.db
        .delete(orderRequestsTable)
        .where(eq(orderRequestsTable.order_request_id, order_request_id))
        .returning();

      if (deleted.length === 0) {
        throw new Error(`OrderRequest with ID ${order_request_id} not found`);
      }

      return this.mapToOrderRequest(deleted[0]);
    } catch (error) {
      logger.error({ error, order_request_id }, "[OrderRequestsRepository] delete error");
      throw error;
    }
  }

  // Extract text from a PDF buffer
  async extractText(pdfBuffer: Buffer): Promise<string[]> {
    try {
      const dataBuffer = Buffer.from(pdfBuffer);
      const doc = await pdfParse(dataBuffer);
      const lines = doc.text.split("\n").filter((line) => line.trim());
      logger.debug({ lineCount: lines.length }, "[OrderRequestsRepository] PDF parsed");
      return lines;
    } catch (error) {
      logger.error({ error }, "[OrderRequestsRepository] Error parsing PDF");
      throw error;
    }
  }
}
