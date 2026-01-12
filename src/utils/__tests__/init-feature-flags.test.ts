import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  // Ensure a fresh module cache and clean mocks for each test
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("init-feature-flags script", () => {
  it("calls initializeFeatureFlags and logs success", async () => {
    const initializeFeatureFlagsMock = vi.fn().mockResolvedValue(undefined);

    // Mock the feature-flags module before importing the script so the script uses our mock
    vi.doMock("@/utils/feature-flags", () => ({ initializeFeatureFlags: initializeFeatureFlagsMock }));

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { default: main } = await import("@/utils/init-feature-flags");

    await expect(main()).resolves.toBeUndefined();

    expect(initializeFeatureFlagsMock).toHaveBeenCalledWith("system");
    // Verify success message was logged
    expect(consoleLogSpy).toHaveBeenCalledWith("✅ Feature flags initialized successfully");
  });

  it("logs error and exits when initializeFeatureFlags throws", async () => {
    const initializeFeatureFlagsMock = vi.fn().mockRejectedValue(new Error("boom"));
    vi.doMock("@/utils/feature-flags", () => ({ initializeFeatureFlags: initializeFeatureFlagsMock }));

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {}) as any);

    const { default: main } = await import("@/utils/init-feature-flags");

    await expect(main()).resolves.toBeUndefined();

    expect(initializeFeatureFlagsMock).toHaveBeenCalledWith("system");
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
