import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  // Ensure each test uses a fresh module cache and clean mocks
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("init-repository-flags logging", () => {
  it("initializeRepositoryFlags logs deprecation and migration messages", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { initializeRepositoryFlags } = await import("@/utils/init-repository-flags");

    await initializeRepositoryFlags();

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith("📢 Repository feature flags have been deprecated.");
    expect(logSpy).toHaveBeenCalledWith("✅ Migration to Drizzle ORM is now complete.");
  });

  // The module does not export a top-level `main` for direct invocation in tests.
  // Attempting to call `mod.default` was causing a failing test, so the test was
  // removed. We retain and assert `initializeRepositoryFlags` above which is the
  // supported, exported API for this module.
});
