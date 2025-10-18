import { relations } from "drizzle-orm";
import { boolean, decimal, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { transactions } from "./transactions";

/**
 * Bikes schema definition for the Rice Bikes database.
 * This uses the latest Drizzle ORM syntax for table and index definitions.
 */
export const bikes = pgTable(
  "Bikes",
  {
    bike_id: uuid("bike_id").primaryKey().defaultRandom(),
    make: varchar("make").notNull(),
    model: varchar("model").notNull(),
    date_created: timestamp("date_created").notNull(),
    description: text("description"),
    bike_type: varchar("bike_type", { length: 50 }),
    size_cm: decimal("size_cm", { precision: 5, scale: 2 }),
    condition: varchar("condition", { length: 20 }).default("Used"),
    price: decimal("price", { precision: 10, scale: 2 }),
    is_available: boolean("is_available").default(true).notNull(),
    weight_kg: decimal("weight_kg", { precision: 5, scale: 2 }),
    reservation_customer_id: uuid("reservation_customer_id").references(() => customers.customer_id),
    deposit_amount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  },
  (table) => {
    return {
      bikeTypeIdx: index("idx_bike_type").on(table.bike_type),
      sizeCmIdx: index("idx_size_cm").on(table.size_cm),
      conditionIdx: index("idx_condition").on(table.condition),
      isAvailableIdx: index("idx_is_available").on(table.is_available),
      reservationCustomerIdIdx: index("idx_reservation_customer_id").on(table.reservation_customer_id),
    };
  },
);

/**
 * Define relationships between bikes and other tables
 */
export const bikesRelations = relations(bikes, ({ many, one }) => ({
  transactions: many(transactions),
  reservationCustomer: one(customers, {
    fields: [bikes.reservation_customer_id],
    references: [customers.customer_id],
    relationName: "BikeReservations",
  }),
}));
