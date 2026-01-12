import { describe, expect, it } from "vitest";

// Importing these modules executes their top-level definitions, which helps
// increase coverage of auto-generated schema files.
import * as bikes from "@/db/schema/bikes";
import * as customers from "@/db/schema/customers";
import * as featureFlags from "@/db/schema/featureFlags";
import * as items from "@/db/schema/items";
import * as orders from "@/db/schema/orders";
import * as permissions from "@/db/schema/permissions";
import * as relationsModule from "@/db/schema/relations";
import * as repairs from "@/db/schema/repairs";
import * as rolePermissions from "@/db/schema/rolePermissions";
import * as roles from "@/db/schema/roles";
import * as transactions from "@/db/schema/transactions";
import * as userRoles from "@/db/schema/userRoles";
import * as users from "@/db/schema/users";
import * as workflowSteps from "@/db/schema/workflowSteps";

describe("DB schema exports", () => {
  it("exports at least one symbol from each schema module", () => {
    const modules = {
      bikes,
      customers,
      items,
      orders,
      permissions,
      relationsModule,
      repairs,
      rolePermissions,
      roles,
      transactions,
      userRoles,
      users,
      workflowSteps,
      featureFlags,
    };

    for (const [name, mod] of Object.entries(modules)) {
      // Ensure the module has exports (this also forces execution of top-level code)
      expect(Object.keys(mod).length).toBeGreaterThan(0);
    }
  });

  it("exposes bikes table and relations", () => {
    expect(bikes.bikes).toBeDefined();
    expect(bikes.bikesRelations).toBeDefined();
  });

  it("exposes transactions and users tables", () => {
    expect(transactions.transactions).toBeDefined();
    expect(users.users).toBeDefined();
  });
});
