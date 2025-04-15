import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { bikeRegistry } from "../api/bikes/bikesRouter";
import { customerRegistry } from "../api/customer/customerRouter";
import { healthCheckRegistry } from "../api/healthCheck/healthCheckRouter";
import { permissionsRegistry } from "../api/security/permissions/permissionRouter";
import { roleRegistry } from "../api/security/roles/roleRouter";
import { userRegistry } from "../api/security/users/userRouter";
import { summaryRegistry } from "../api/summary/summaryRouter";
import { itemRegistry } from "../api/transactionComponents/items/itemRouter";
import { OrderRequestsRegistry } from "../api/transactionComponents/orderRequests/orderRequestsRouter";
import { repairRegistry } from "../api/transactionComponents/repairs/repairRouter";
import { transactionDetailsRegistry } from "../api/transactionComponents/transactionDetails/transactionDetailsRouter";
import { tranasactionLogsRegistry } from "../api/transactionComponents/transactionLogs/transactionLogsRouter";
import { transactionRegistry } from "../api/transactionComponents/transactions/transactionRouter";

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    transactionRegistry,
    bikeRegistry,
    transactionDetailsRegistry,
    customerRegistry,
    userRegistry,
    repairRegistry,
    itemRegistry,
    summaryRegistry,
    OrderRequestsRegistry,
    tranasactionLogsRegistry,
    roleRegistry,
    permissionsRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Swagger API",
    },
    externalDocs: {
      description: "View the raw OpenAPI Specification in JSON format",
      url: "/swagger.json",
    },
  });
}
