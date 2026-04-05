import { relations } from "drizzle-orm";
import { char, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { bikes } from "./bikes";
import { transactions } from "./transactions";

export const customers = pgTable(
  "Customers",
  {
    customer_id: uuid("customer_id").defaultRandom().primaryKey(),
    first_name: text("first_name"),
    last_name: text("last_name"),
    email: text("email"),
    phone: char("phone", { length: 10 }),
  },
  (table) => [index("idx_customer_id").using("btree", table.customer_id)],
);

export const customersRelations = relations(customers, ({ many }) => ({
  transactions: many(transactions),
  reservedBikes: many(bikes, { relationName: "BikeReservations" }),
}));
