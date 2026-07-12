import { relations, sql } from "drizzle-orm";
import { boolean, check, foreignKey, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { stepBundles } from "./stepBundles";
import { transactions } from "./transactions";

export const steps = pgTable(
  "Steps",
  {
    step_id: uuid("step_id").primaryKey().defaultRandom(),
    // A step belongs to exactly one of a transaction or a step bundle (see
    // parent_xor_check below). Bundle-owned steps are templates that get
    // copied into a transaction's own steps when the bundle is applied.
    transaction_id: uuid("transaction_id"),
    bundle_id: uuid("bundle_id"),
    description: text("description").notNull(),
    completed: boolean("completed").default(false).notNull(),
    // Sparse position of this step within its parent's step list (gaps of
    // 1000 by default). A step can be inserted between two others by setting
    // step_order to the midpoint of their two values instead of shifting any
    // other rows. The unique indexes below are what actually enforce
    // ordering: they guarantee no two steps under the same parent share a
    // position.
    step_order: integer("step_order").notNull(),
  },
  (table) => ({
    transaction_id_fk: foreignKey({
      columns: [table.transaction_id],
      foreignColumns: [transactions.transaction_id],
      name: "Steps_transaction_id_fkey",
    }).onDelete("cascade"),
    bundle_id_fk: foreignKey({
      columns: [table.bundle_id],
      foreignColumns: [stepBundles.bundle_id],
      name: "Steps_bundle_id_fkey",
    }).onDelete("cascade"),
    parent_xor_check: check(
      "Steps_parent_xor",
      sql`(${table.transaction_id} IS NOT NULL AND ${table.bundle_id} IS NULL) OR (${table.transaction_id} IS NULL AND ${table.bundle_id} IS NOT NULL)`,
    ),
    step_order_check: check("Steps_step_order_positive", sql`${table.step_order} > 0`),
    transaction_step_order_unique: uniqueIndex("Steps_transaction_id_step_order_key").using(
      "btree",
      table.transaction_id,
      table.step_order,
    ),
    bundle_step_order_unique: uniqueIndex("Steps_bundle_id_step_order_key").using(
      "btree",
      table.bundle_id,
      table.step_order,
    ),
    transaction_id_idx: index("Steps_transaction_id_idx").using("btree", table.transaction_id),
    bundle_id_idx: index("Steps_bundle_id_idx").using("btree", table.bundle_id),
  }),
);

export const stepsRelations = relations(steps, ({ one }) => ({
  transaction: one(transactions, {
    fields: [steps.transaction_id],
    references: [transactions.transaction_id],
  }),
  bundle: one(stepBundles, {
    fields: [steps.bundle_id],
    references: [stepBundles.bundle_id],
  }),
}));

// Reverse relations declared here (rather than editing transactions.ts /
// stepBundles.ts) so those existing schema files don't need to change,
// mirroring how WorkflowSteps declares its relation onto users in
// workflowSteps.ts instead of users.ts.
export const transactionsToStepsRelations = relations(transactions, ({ many }) => ({
  steps: many(steps),
}));

export const stepBundlesToStepsRelations = relations(stepBundles, ({ many }) => ({
  steps: many(steps),
}));
