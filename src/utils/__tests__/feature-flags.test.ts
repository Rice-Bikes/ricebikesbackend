import { db } from "@/db/client";
import {
  FeatureFlag,
  clearFeatureFlagCache,
  initializeFeatureFlags,
  isFeatureEnabled,
  updateFeatureFlag,
} from "@/utils/feature-flags";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.restoreAllMocks();
  clearFeatureFlagCache();
  process.env.FEATURE_NEW_BIKE_FORM = undefined;
});

describe("feature flag utilities", () => {
  it("respects environment variable override", async () => {
    process.env.FEATURE_NEW_BIKE_FORM = "true";
    const enabled = await isFeatureEnabled(FeatureFlag.NEW_BIKE_FORM, false);
    expect(enabled).toBe(true);
  });

  it("reads from db and caches the value", async () => {
    const selectSpy = vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.resolve([{ value: true }]),
          }),
        }) as any,
    );

    const enabled = await isFeatureEnabled("some_flag", false);
    expect(enabled).toBe(true);
    expect(selectSpy).toHaveBeenCalledTimes(1);

    // second call should hit the cache and not call db.select again
    const enabled2 = await isFeatureEnabled("some_flag", false);
    expect(enabled2).toBe(true);
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  it("returns default and warns if FeatureFlags table doesn't exist", async () => {
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.reject(new Error('relation "FeatureFlags" does not exist')),
          }),
        }) as any,
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const enabled = await isFeatureEnabled("some_other", true);
    expect(enabled).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("returns default and logs error for other db errors", async () => {
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.reject(new Error("connection refused")),
          }),
        }) as any,
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const enabled = await isFeatureEnabled("some_flag2", false);
    expect(enabled).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("updateFeatureFlag updates existing flag and writes audit", async () => {
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.resolve([{ value: false }]),
          }),
        }) as any,
    );

    const updateSpy = vi.spyOn(db, "update").mockImplementation(
      () =>
        ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }) as any,
    );

    const insertSpy = vi.spyOn(db, "insert").mockImplementation(
      () =>
        ({
          values: () => Promise.resolve(),
        }) as any,
    );

    const result = await updateFeatureFlag("flag", true, "tester");
    expect(result).toBe(true);
    expect(updateSpy).toHaveBeenCalled();
    expect(insertSpy).toHaveBeenCalled();
  });

  it("updateFeatureFlag sets cache when table doesn't exist", async () => {
    const selectSpy = vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.reject(new Error('relation "FeatureFlags" does not exist')),
          }),
        }) as any,
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await updateFeatureFlag("flag2", true, "tester2");
    expect(res).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    // now the value should be cached and returned by isFeatureEnabled
    const enabled = await isFeatureEnabled("flag2", false);
    expect(enabled).toBe(true);
    expect(selectSpy).toHaveBeenCalled();
  });

  it("initializeFeatureFlags creates flags when absent", async () => {
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.resolve([]),
          }),
        }) as any,
    );

    const insertSpy = vi.spyOn(db, "insert").mockImplementation(
      () =>
        ({
          values: () => Promise.resolve(),
        }) as any,
    );

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await initializeFeatureFlags("system");
    expect(insertSpy).toHaveBeenCalled();
    expect(insertSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(logSpy).toHaveBeenCalled();
  });

  it("initializeFeatureFlags returns early if FeatureFlags table missing", async () => {
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.reject(new Error('relation "FeatureFlags" does not exist')),
          }),
        }) as any,
    );

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const insertSpy = vi.spyOn(db, "insert").mockImplementation(
      () =>
        ({
          values: () => Promise.resolve(),
        }) as any,
    );

    await initializeFeatureFlags("system");
    expect(warnSpy).toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("clearFeatureFlagCache clears the cache so that next lookup hits the DB", async () => {
    // Force cache by having select throw and calling updateFeatureFlag
    vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.reject(new Error('relation "FeatureFlags" does not exist')),
          }),
        }) as any,
    );

    await updateFeatureFlag("cacheFlag", true, "tester");

    // Now clear cache and set select to return a different value
    clearFeatureFlagCache();
    const selectSpy2 = vi.spyOn(db, "select").mockImplementation(
      () =>
        ({
          from: () => ({
            where: () => Promise.resolve([{ value: false }]),
          }),
        }) as any,
    );

    const enabled = await isFeatureEnabled("cacheFlag", false);
    expect(enabled).toBe(false);
    expect(selectSpy2).toHaveBeenCalled();
  });
});
