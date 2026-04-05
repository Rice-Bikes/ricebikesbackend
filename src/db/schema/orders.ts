import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orders = pgTable("order", {
  order_id: uuid("order_id").primaryKey().defaultRandom(),
  order_date: timestamp("order_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
  estimated_delivery: timestamp("estimated_delivery").notNull(),
  supplier: text("supplier").notNull(),
  ordered_by: text("ordered_by").notNull(),
});

export const ordersRelations = relations(orders, () => ({}));
