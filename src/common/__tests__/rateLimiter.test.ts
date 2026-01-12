import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rateLimiter module", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Ensure a fresh module cache so the import picks up our mocks/env changes
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calls express-rate-limit with values derived from env and exposes a keyGenerator", async () => {
    const mockRateLimit = vi.fn(() => "mock-limiter");
    vi.doMock("express-rate-limit", () => ({ rateLimit: mockRateLimit }));

    // Set custom env values before importing the module so envConfig picks them up
    process.env.COMMON_RATE_LIMIT_MAX_REQUESTS = "42";
    process.env.COMMON_RATE_LIMIT_WINDOW_MS = "2";

    // Import after mocking and env changes so the module's top-level code runs with our mocks
    await import("@/common/middleware/rateLimiter");

    expect(mockRateLimit).toHaveBeenCalledTimes(1);

    // Guard and cast to avoid TypeScript tuple/undefined warnings
    const calls = mockRateLimit.mock.calls as any[];
    expect(calls.length).toBeGreaterThan(0);
    const opts = calls[0][0] as any;
    expect(opts).toBeTruthy();
    expect(opts.legacyHeaders).toBe(true);
    expect(opts.limit).toBe(42);
    expect(opts.windowMs).toBe(15 * 60 * 2);
    expect(typeof opts.keyGenerator).toBe("function");

    // keyGenerator should extract the ip property from the request object
    const key = opts.keyGenerator({ ip: "127.0.0.1" } as any);
    expect(key).toBe("127.0.0.1");
  });

  it("uses sensible defaults when env variables are missing", async () => {
    const mockRateLimit = vi.fn(() => "mock-limiter-defaults");
    vi.doMock("express-rate-limit", () => ({ rateLimit: mockRateLimit }));

    // Ensure env vars are unset so defaults from envConfig are applied
    process.env.COMMON_RATE_LIMIT_MAX_REQUESTS = undefined;
    process.env.COMMON_RATE_LIMIT_WINDOW_MS = undefined;

    await import("@/common/middleware/rateLimiter");

    expect(mockRateLimit).toHaveBeenCalledTimes(1);

    // Guard and cast the mock calls to avoid tuple typing issues
    const calls = mockRateLimit.mock.calls as any[];
    expect(calls.length).toBeGreaterThan(0);
    const opts = calls[0][0] as any;

    expect(typeof opts.limit).toBe("number");
    expect(opts.limit).toBeGreaterThan(0);

    expect(typeof opts.windowMs).toBe("number");
    expect(opts.windowMs).toBeGreaterThan(0);
  });
});
