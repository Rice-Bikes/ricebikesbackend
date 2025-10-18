import { type InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { bikes } from "./bikes";
import { customers } from "./customers";
import { items } from "./items";
import { repairs } from "./repairs";
import { users } from "./users";

export const transactions = pgTable("Transactions", {
  transaction_num: serial("transaction_num").primaryKey(),
  transaction_id: uuid("transaction_id").unique().defaultRandom(),
  date_created: timestamp("date_created").notNull(),
  transaction_type: varchar("transaction_type").notNull(),
  customer_id: uuid("customer_id")
    .notNull()
    .references(() => customers.customer_id),
  bike_id: uuid("bike_id").references(() => bikes.bike_id),
  total_cost: doublePrecision("total_cost").notNull(),
  description: text("description"),
  is_completed: boolean("is_completed").notNull(),
  is_paid: boolean("is_paid").notNull(),
  is_refurb: boolean("is_refurb").notNull(),
  is_urgent: boolean("is_urgent").notNull(),
  is_nuclear: boolean("is_nuclear"),
  is_beer_bike: boolean("is_beer_bike").notNull(),
  is_employee: boolean("is_employee").notNull(),
  is_reserved: boolean("is_reserved").notNull(),
  is_waiting_on_email: boolean("is_waiting_on_email").notNull(),
  date_completed: timestamp("date_completed"),
});

export const transactionLogs = pgTable("TransactionLogs", {
  log_id: uuid("log_id").primaryKey().defaultRandom(),
  date_modified: timestamp("date_modified").notNull(),
  transaction_num: integer("transaction_num")
    .notNull()
    .references(() => transactions.transaction_num),
  changed_by: uuid("changed_by")
    .notNull()
    .references(() => users.user_id),
  change_type: varchar("change_type").notNull(),
  description: text("description").notNull(),
});

export const transactionDetails = pgTable("TransactionDetails", {
  transaction_detail_id: uuid("transaction_detail_id").primaryKey().defaultRandom(),
  transaction_id: uuid("transaction_id")
    .defaultRandom()
    .notNull()
    .references(() => transactions.transaction_id),
  item_id: uuid("item_id").references(() => items.item_id),
  repair_id: uuid("repair_id").references(() => repairs.repair_id),
  changed_by: uuid("changed_by"),
  completed: boolean("completed").notNull(),
  quantity: integer("quantity").notNull(),
  date_modified: timestamp("date_modified").notNull(),
});

export const orderRequests = pgTable("OrderRequests", {
  order_request_id: uuid("order_request_id").primaryKey().defaultRandom(),
  created_by: uuid("created_by")
    .notNull()
    .references(() => users.user_id),
  transaction_id: uuid("transaction_id")
    .notNull()
    .references(() => transactions.transaction_id),
  item_id: uuid("item_id")
    .notNull()
    .references(() => items.item_id),
  date_created: timestamp("date_created").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  ordered: boolean("ordered").notNull(),
});

// Export types for use in other schema files
export type TransactionLog = InferSelectModel<typeof transactionLogs>;
export type OrderRequest = InferSelectModel<typeof orderRequests>;

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [transactions.customer_id],
    references: [customers.customer_id],
  }),
  bike: one(bikes, {
    fields: [transactions.bike_id],
    references: [bikes.bike_id],
  }),
  transactionLogs: many(transactionLogs),
  orderRequests: many(orderRequests),
  transactionDetails: many(transactionDetails),
}));

export const transactionLogsRelations = relations(transactionLogs, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLogs.transaction_num],
    references: [transactions.transaction_num],
  }),
  user: one(users, {
    fields: [transactionLogs.changed_by],
    references: [users.user_id],
  }),
}));

export const orderRequestsRelations = relations(orderRequests, ({ one }) => ({
  transaction: one(transactions, {
    fields: [orderRequests.transaction_id],
    references: [transactions.transaction_id],
  }),
  item: one(items, {
    fields: [orderRequests.item_id],
    references: [items.item_id],
  }),
  user: one(users, {
    fields: [orderRequests.created_by],
    references: [users.user_id],
  }),
}));

// Define relations to users
export const usersToTransactionsRelations = relations(users, ({ many }) => ({
  orderRequests: many(orderRequests),
  transactionLogs: many(transactionLogs),
}));

export const transactionDetailsRelations = relations(transactionDetails, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionDetails.transaction_id],
    references: [transactions.transaction_id],
  }),
  item: one(items, {
    fields: [transactionDetails.item_id],
    references: [items.item_id],
  }),
  repair: one(repairs, {
    fields: [transactionDetails.repair_id],
    references: [repairs.repair_id],
  }),
}));
