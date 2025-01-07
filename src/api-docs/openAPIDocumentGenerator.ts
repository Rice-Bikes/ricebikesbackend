import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { bikeRegistry } from "@/api/bikes/bikesRouter";
import { customerRegistry } from "@/api/customer/customerRouter";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { transactionDetailsRegistry } from "@/api/transactionDetails/transactionDetailsRouter";
import { transactionRegistry } from "@/api/transactions/transactionRouter";

export function generateOpenAPIDocument() {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    transactionRegistry,
    bikeRegistry,
    transactionDetailsRegistry,
    customerRegistry,
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
