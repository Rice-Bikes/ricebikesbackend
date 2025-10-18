import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const orders = pgTable("order", {
  order_id: uuid("order_id").primaryKey().defaultRandom(),
  order_date: timestamp("order_date").defaultNow().notNull(),
  estimated_delivery: timestamp("estimated_delivery").notNull(),
  supplier: varchar("supplier").notNull(),
  ordered_by: varchar("ordered_by").notNull(),
});

export const ordersRelations = relations(orders, () => ({}));
