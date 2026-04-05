import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  decimal,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { transactions } from "./transactions";

/**
 * Bikes schema definition for the Rice Bikes database.
 * This uses the latest Drizzle ORM syntax for table and index definitions.
 */
export const bikes = pgTable(
  "Bikes",
  {
    bike_id: uuid("bike_id").primaryKey(),
    make: text("make"),
    model: text("model"),
    description: text("description"),
    date_created: timestamp("date_created").default(sql`CURRENT_TIMESTAMP`),
    customer_id: uuid("customer_id"),
    bike_type: varchar("bike_type", { length: 50 }),
    size_cm: decimal("size_cm", { precision: 5, scale: 2 }),
    condition: varchar("condition", { length: 20 }).default("New"),
    price: decimal("price", { precision: 10, scale: 2 }),
    is_available: boolean("is_available").default(true),
    weight_kg: decimal("weight_kg", { precision: 5, scale: 2 }),
    reservation_customer_id: uuid("reservation_customer_id"),
    deposit_amount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  },
  (table) => {
    return {
      customer_id_fk: foreignKey({
        columns: [table.customer_id],
        foreignColumns: [customers.customer_id],
        name: "Bikes_customer_id_fkey",
      }).onDelete("cascade"),
      reservation_customer_id_fk: foreignKey({
        columns: [table.reservation_customer_id],
        foreignColumns: [customers.customer_id],
        name: "fk_bikes_reservation_customer",
      }),
      deposit_check: check(
        "bikes_deposit_check",
        sql`(${table.deposit_amount} IS NULL) OR (deposit_amount >= (0)::numeric)`,
      ),
      price_check: check("bikes_price_check", sql`(${table.price} IS NULL) OR (price >= (0)::numeric)`),
      weight_check: check("bikes_weight_check", sql`(${table.weight_kg} IS NULL) OR (weight_kg > (0)::numeric)`),
      bike_type_idx: index("idx_bikes_bike_type").using("btree", table.bike_type),
      size_cm_idx: index("idx_bikes_size_cm").using("btree", table.size_cm),
      condition_idx: index("idx_bikes_condition").using("btree", table.condition),
      is_available_idx: index("idx_bikes_is_available").using("btree", table.is_available),
      reservation_customer_id_idx: index("idx_bikes_reservation_customer").using(
        "btree",
        table.reservation_customer_id,
      ),
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
