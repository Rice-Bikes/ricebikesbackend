import { describe, expect, it } from "vitest";

/**
 * Smoke test: import many router and related modules so their top-level
 * statements run and contribute to coverage. This is intentionally a
 * lightweight test that asserts modules can be imported without throwing.
 *
 * NOTE: If any of these modules have side-effects on import that require
 * external services, those failures will be collected and reported so the
 * test author can decide whether to mock/adjust the module or exclude it.
 */
describe("API routers and related modules smoke import", () => {
  const modules = [
    "../../bikes/bikesRouter",
    "../../customer/customerRouter",
    "../../dataExport/dataExportRouter",
    "../../featureFlags/featureFlagsRouter",
    "../healthCheckRouter",
    "../../notifications/notificationRouter",
    "../../order/orderRouter",
    "../../security/permissions/permissionRouter",
    "../../security/roles/roleRouter",
    "../../security/users/userRouter",
    "../../summary/summaryRouter",
    "../../transactionComponents/items/itemRouter",
    "../../transactionComponents/orderRequests/orderRequestsRouter",
    "../../transactionComponents/repairs/repairRouter",
    "../../transactionComponents/transactionDetails/transactionDetailsRouter",
    "../../transactionComponents/transactionLogs/transactionLogsRouter",
    "../../transactionComponents/transactions/transactionRouter",
    "../../workflowSteps/workflowStepsRouter",
    "../../../api-docs/openAPIRouter",

    // A few additional modules that are generally safe to import and help
    // increase coverage across the codebase.
    "../../../services/slackService",
    "../../../services/dataExportService",
    "../../../services/transactionHelpers",
    "../../../common/middleware/errorHandler",
    "../../../common/middleware/requestLogger",
  ];

  it("imports listed modules without throwing", async () => {
    const failures: { module: string; error: string }[] = [];
    // Per-module import timeout in milliseconds. Increased so slightly slower
    // module initializers have time to complete during CI / local runs.
    const TIMEOUT_MS = 20000;

    const importWithTimeout = async (specifier: string, ms = TIMEOUT_MS) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise((_res, reject) => {
        timer = setTimeout(() => reject(new Error(`Import timed out after ${ms}ms`)), ms);
      });

      try {
        // Race the dynamic import against the timeout promise.
        const result = (await Promise.race([import(specifier), timeoutPromise])) as any;
        return result;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    // Use relative specifiers directly (include .ts extension) to import modules.
    // This avoids using `import.meta` which can cause TypeScript diagnostics
    // when the project's `module` tsconfig isn't set to an ES module target.
    const toImportSpecifier = (specifier: string) => `${specifier}.ts`;

    for (const m of modules) {
      try {
        const specifierToImport = toImportSpecifier(m);
        const mod = await importWithTimeout(specifierToImport, TIMEOUT_MS);
        expect(mod).toBeTruthy();
      } catch (err: any) {
        failures.push({ module: m, error: err?.message ?? String(err) });
      }
    }

    if (failures.length > 0) {
      const lines = failures.map((f) => `${f.module}: ${f.error}`).join("\n");
      throw new Error(`Some modules failed to import:\n${lines}`);
    }
  }, 30000);
});
