import { type InferSelectModel, relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
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

export const transactions = pgTable(
  "Transactions",
  {
    transaction_num: serial("transaction_num").primaryKey(),
    transaction_id: uuid("transaction_id").unique("Transactions_transaction_id_key").defaultRandom().notNull(),
    date_created: timestamp("date_created"),
    transaction_type: text("transaction_type"),
    customer_id: uuid("customer_id"),
    total_cost: doublePrecision("total_cost"),
    is_paid: boolean("is_paid"),
    is_completed: boolean("is_completed"),
    description: text("description"),
    is_refurb: boolean("is_refurb"),
    is_urgent: boolean("is_urgent"),
    is_beer_bike: boolean("is_beer_bike"),
    is_employee: boolean("is_employee"),
    is_reserved: boolean("is_reserved"),
    is_waiting_on_email: boolean("is_waiting_on_email"),
    date_completed: timestamp("date_completed"),
    completed: boolean("completed"),
    is_status: text("is_status"),
    is_nuclear: boolean("is_nuclear"),
    bike_id: uuid("bike_id"),
  },
  (table) => {
    return {
      customer_id_fk: foreignKey({
        columns: [table.customer_id],
        foreignColumns: [customers.customer_id],
        name: "Transactions_customer_id_fkey",
      }),
      bike_id_fk: foreignKey({
        columns: [table.bike_id],
        foreignColumns: [bikes.bike_id],
        name: "Transactions_bike_id_fkey",
      }),
    };
  },
);

export const transactionLogs = pgTable(
  "TransactionLogs",
  {
    log_id: uuid("log_id").primaryKey(),
    transaction_num: integer("transaction_num").notNull(),
    changed_by: uuid("changed_by").notNull(),
    date_modified: timestamp("date_modified").notNull(),
    change_type: text("change_type").notNull(),
    description: text("description").notNull(),
  },
  (table) => {
    return {
      transaction_num_fk: foreignKey({
        columns: [table.transaction_num],
        foreignColumns: [transactions.transaction_num],
        name: "TransactionLogs_transaction_num_fkey",
      }).onDelete("cascade"),
      changed_by_fk: foreignKey({
        columns: [table.changed_by],
        foreignColumns: [users.user_id],
        name: "TransactionLogs_changed_by_fkey",
      }).onDelete("set null"),
    };
  },
);

export const transactionDetails = pgTable(
  "TransactionDetails",
  {
    transaction_detail_id: uuid("transaction_detail_id").primaryKey(),
    transaction_id: uuid("transaction_id").notNull(),
    item_id: uuid("item_id"),
    repair_id: uuid("repair_id"),
    completed: boolean("completed").notNull().default(true),
    changed_by: uuid("changed_by"),
    quantity: integer("quantity").notNull(),
    date_modified: timestamp("date_modified").notNull(),
  },
  (table) => {
    return {
      transaction_id_fk: foreignKey({
        columns: [table.transaction_id],
        foreignColumns: [transactions.transaction_id],
        name: "fk_transaction",
      }).onDelete("cascade"),
      item_id_fk: foreignKey({
        columns: [table.item_id],
        foreignColumns: [items.item_id],
        name: "fk_item",
      }).onDelete("set null"),
      repair_id_fk: foreignKey({
        columns: [table.repair_id],
        foreignColumns: [repairs.repair_id],
        name: "fk_repair",
      }).onDelete("set null"),
      changed_by_fk: foreignKey({
        columns: [table.changed_by],
        foreignColumns: [users.user_id],
        name: "fk_changed_by",
      }).onDelete("set null"),
    };
  },
);

export const orderRequests = pgTable(
  "OrderRequests",
  {
    order_request_id: uuid("order_request_id").primaryKey().defaultRandom(),
    created_by: uuid("created_by").notNull(),
    transaction_id: uuid("transaction_id"),
    item_id: uuid("item_id").notNull(),
    date_created: timestamp("date_created").notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    ordered: boolean("ordered").default(false),
  },
  (table) => {
    return {
      created_by_fk: foreignKey({
        columns: [table.created_by],
        foreignColumns: [users.user_id],
        name: "fk_created_by",
      }).onDelete("set null"),
      transaction_id_fk: foreignKey({
        columns: [table.transaction_id],
        foreignColumns: [transactions.transaction_id],
        name: "fk_transaction",
      }).onDelete("cascade"),
      item_id_fk: foreignKey({
        columns: [table.item_id],
        foreignColumns: [items.item_id],
        name: "fk_item",
      }).onDelete("cascade"),
    };
  },
);

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
