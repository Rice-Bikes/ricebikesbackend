// Import all schemas and their relations from relations file
import {
  bikes,
  customers,
  featureFlagAudit,
  featureFlags,
  items,
  orderRequests,
  orders,
  permissions,
  repairs,
  rolePermissions,
  roles,
  transactionDetails,
  transactionLogs,
  transactions,
  userRoles,
  users,
  workflowSteps,
} from "./relations";

// Export all schemas
export * from "./relations";

// Export all schemas for use in migrations
export const schemas = {
  bikes,
  customers,
  featureFlags,
  featureFlagAudit,
  items,
  orders,
  permissions,
  repairs,
  roles,
  rolePermissions,
  transactions,
  transactionDetails,
  transactionLogs,
  userRoles,
  users,
  workflowSteps,
  orderRequests,
};
