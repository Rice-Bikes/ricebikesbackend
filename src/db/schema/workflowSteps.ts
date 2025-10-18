import { type InferSelectModel, relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { transactions } from "./transactions";
import { users } from "./users";

export const workflowSteps = pgTable(
  "WorkflowSteps",
  {
    step_id: uuid("step_id").primaryKey().defaultRandom(),
    transaction_id: uuid("transaction_id")
      .notNull()
      .references(() => transactions.transaction_id, { onDelete: "cascade" }),
    workflow_type: varchar("workflow_type", { length: 50 }).notNull(), // 'bike_sales', 'repair_process', 'order_fulfillment', etc.
    step_name: varchar("step_name", { length: 100 }).notNull(),
    step_order: integer("step_order").notNull(), // Order of step in workflow (1, 2, 3, etc.)
    is_completed: boolean("is_completed").default(false).notNull(),
    created_by: uuid("created_by")
      .notNull()
      .references(() => users.user_id),
    completed_by: uuid("completed_by").references(() => users.user_id),
    created_at: timestamp("created_at").defaultNow().notNull(),
    completed_at: timestamp("completed_at"),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    transactionWorkflowStepOrderUnique: uniqueIndex("transaction_workflow_step_order_unique").on(
      table.transaction_id,
      table.workflow_type,
      table.step_order,
    ),
    transactionIdIdx: index("idx_workflow_steps_transaction_id").on(table.transaction_id),
    workflowTypeIdx: index("idx_workflow_steps_workflow_type").on(table.workflow_type),
    transactionWorkflowTypeIdx: index("idx_workflow_steps_transaction_workflow").on(
      table.transaction_id,
      table.workflow_type,
    ),
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
