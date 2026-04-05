import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { transactionDetails } from "./transactions";

export const repairs = pgTable("Repairs", {
  repair_id: uuid("repair_id").primaryKey().defaultRandom(),
  name: text("name"),
  price: integer("price"),
  disabled: boolean("disabled"),
  description: text("description"),
});

export const repairsRelations = relations(repairs, ({ many }) => ({
  transactionDetails: many(transactionDetails),
}));
