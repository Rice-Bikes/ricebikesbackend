import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { transactions } from "./transactions";
import { users } from "./users";

export const workflowSteps = pgTable(
  "WorkflowSteps",
  {
    step_id: uuid("step_id").primaryKey().defaultRandom(),
    transaction_id: uuid("transaction_id").notNull(),
    workflow_type: varchar("workflow_type", { length: 50 }).notNull(), // 'bike_sales', 'repair_process', 'order_fulfillment', etc.
    step_name: varchar("step_name", { length: 100 }).notNull(),
    step_order: integer("step_order").notNull(), // Order of step in workflow (1, 2, 3, etc.)
    is_completed: boolean("is_completed").default(false).notNull(),
    created_by: uuid("created_by").notNull(),
    completed_by: uuid("completed_by"),
    created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
    completed_at: timestamp("completed_at"),
    updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  (table) => ({
    transaction_id_fk: foreignKey({
      columns: [table.transaction_id],
      foreignColumns: [transactions.transaction_id],
      name: "WorkflowSteps_transaction_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    completed_by_fk: foreignKey({
      columns: [table.completed_by],
      foreignColumns: [users.user_id],
      name: "WorkflowSteps_completed_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    created_by_fk: foreignKey({
      columns: [table.created_by],
      foreignColumns: [users.user_id],
      name: "WorkflowSteps_created_by_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    step_order_check: check("WorkflowSteps_step_order_positive", sql`${table.step_order} > 0`),
    workflow_type_check: check(
      "WorkflowSteps_workflow_type_valid",
      sql`(${table.workflow_type})::text = ANY (ARRAY[('bike_sales'::character varying)::text, ('repair_process'::character varying)::text, ('order_fulfillment'::character varying)::text, ('custom_workflow'::character varying)::text])`,
    ),

    transaction_workflow_step_order_unique: uniqueIndex(
      "WorkflowSteps_transaction_id_workflow_type_step_order_key",
    ).using("btree", table.transaction_id, table.workflow_type, table.step_order),
    transaction_id_idx: index("WorkflowSteps_transaction_id_idx").using("btree", table.transaction_id),
    workflow_type_idx: index("WorkflowSteps_transaction_id_workflow_type_idx").using(
      "btree",
      table.transaction_id,
      table.workflow_type,
    ),
    transaction_workflow_type_idx: index("WorkflowSteps_workflow_type_idx").using("btree", table.workflow_type),
  }),
);

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  transaction: one(transactions, {
    fields: [workflowSteps.transaction_id],
    references: [transactions.transaction_id],
  }),
  createdByUser: one(users, {
    fields: [workflowSteps.created_by],
    references: [users.user_id],
    relationName: "WorkflowStepsCreatedBy",
  }),
  completedByUser: one(users, {
    fields: [workflowSteps.completed_by],
    references: [users.user_id],
    relationName: "WorkflowStepsCompletedBy",
  }),
}));

// Export type for use in other schema files
export type WorkflowStep = InferSelectModel<typeof workflowSteps>;

// Define relations to users
export const usersToWorkflowStepsRelations = relations(users, ({ many }) => ({
  workflowStepsCreated: many(workflowSteps, {
    relationName: "WorkflowStepsCreatedBy",
  }),
  workflowStepsCompleted: many(workflowSteps, {
    relationName: "WorkflowStepsCompletedBy",
  }),
}));
