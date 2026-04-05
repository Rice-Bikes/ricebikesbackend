import { relations } from "drizzle-orm";
import { boolean, doublePrecision, integer, json, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { orderRequests } from "./transactions";
import { transactionDetails } from "./transactions";

export const items = pgTable("Items", {
  item_id: uuid("item_id").primaryKey().defaultRandom(),
  upc: text("upc").unique("unique_upc"),
  name: text("name"),
  description: text("description"),
  brand: text("brand"),
  desiredStock: doublePrecision("desired_stock"),
  stock: integer("stock").default(0),
  minimum_stock: integer("minimum_stock").default(0),
  standard_price: numeric("standard_price", { precision: 10, scale: 2 }),
  wholesale_cost: numeric("wholesale_cost", { precision: 10, scale: 2 }),
  condition: text("condition"),
  disabled: boolean("disabled").default(false),
  managed: boolean("managed"),
  size: text("size"),
  category_1: text("category_1"),
  category_2: text("category_2"),
  category_3: text("category_3"),
  features: json("features"),
  specifications: json("specifications"),
});

export const itemsRelations = relations(items, ({ many }) => ({
  orderRequests: many(orderRequests),
  transactionDetails: many(transactionDetails),
}));
