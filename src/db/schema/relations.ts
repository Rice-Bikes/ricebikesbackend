import { relations } from "drizzle-orm";
import { orderRequests, transactionLogs } from "./transactions";
import { userRoles } from "./userRoles";
import { users } from "./users";
import { workflowSteps } from "./workflowSteps";

// Define all user relations here to avoid circular dependencies
export const usersRelations = relations(users, ({ many }) => ({
  orderRequests: many(orderRequests),
  transactionLogs: many(transactionLogs),
  userRoles: many(userRoles),
  workflowStepsCreated: many(workflowSteps, {
    relationName: "WorkflowStepsCreatedBy",
  }),
  workflowStepsCompleted: many(workflowSteps, {
    relationName: "WorkflowStepsCompletedBy",
  }),
}));

// Export everything from relations file
export { roles } from "./roles";
export * from "./users";
export * from "./permissions";
export * from "./rolePermissions";
export * from "./userRoles";
export * from "./bikes";
export * from "./customers";
export * from "./items";
export * from "./repairs";
export * from "./transactions";
export * from "./orders";
export * from "./featureFlags";
export * from "./workflowSteps";
