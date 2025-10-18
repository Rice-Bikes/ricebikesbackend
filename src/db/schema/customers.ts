import { relations } from "drizzle-orm";
import { char, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { bikes } from "./bikes";
import { transactions } from "./transactions";

export const customers = pgTable("Customers", {
  customer_id: uuid("customer_id").primaryKey().defaultRandom(),
  first_name: varchar("first_name").notNull(),
  last_name: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: char("phone", { length: 10 }),
});

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
  reservedBikes: many(bikes, { relationName: "BikeReservations" }),
}));
