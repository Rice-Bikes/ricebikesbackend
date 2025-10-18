import { relations } from "drizzle-orm";
import { boolean, doublePrecision, integer, json, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { orderRequests } from "./transactions";
import { transactionDetails } from "./transactions";

export const items = pgTable("Items", {
  item_id: uuid("item_id").primaryKey().defaultRandom(),
  upc: varchar("upc").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  brand: varchar("brand"),
  stock: integer("stock").notNull(),
  minimum_stock: integer("minimum_stock"),
  standard_price: doublePrecision("standard_price").notNull(),
  wholesale_cost: doublePrecision("wholesale_cost").notNull(),
  condition: varchar("condition"),
  disabled: boolean("disabled").notNull(),
  managed: boolean("managed"),
  category_1: varchar("category_1"),
  category_2: varchar("category_2"),
  category_3: varchar("category_3"),
  specifications: json("specifications"),
  features: json("features"),
});

export const itemsRelations = relations(items, ({ many }) => ({
  orderRequests: many(orderRequests),
  transactionDetails: many(transactionDetails),
}));
