import { relations } from "drizzle-orm";
import { userRoles } from "./roles";
import { orderRequests, transactionLogs } from "./transactions";
import { users } from "./users";
import { workflowSteps } from "./workflowSteps";

// Define all user relations here to avoid circular dependencies
export const usersRelations = relations(users, ({ many }) => ({
  orderRequests: many(orderRequests),
  transactionLogs: many(transactionLogs),
  userRoles: many(userRoles),
  workflowStepsCreated: many(workflowSteps, { relationName: "WorkflowStepsCreatedBy" }),
  workflowStepsCompleted: many(workflowSteps, { relationName: "WorkflowStepsCompletedBy" }),
}));

// Export everything from relations file
export * from "./users";
export * from "./roles";
export * from "./bikes";
export * from "./customers";
export * from "./items";
export * from "./repairs";
export * from "./transactions";
export * from "./orders";
export * from "./featureFlags";
export * from "./workflowSteps";
