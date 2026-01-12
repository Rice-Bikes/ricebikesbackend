import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock node-fetch so we can control HTTP responses without making real network calls.
// This mock will be hoisted so it affects dynamic imports performed after resetModules().
vi.mock("node-fetch", () => ({ default: vi.fn() }));

describe("SlackService", () => {
  // Silence console logs to keep test output clean
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Ensure fresh module import per test so constructor picks up test-specific env vars
    vi.resetModules();
    process.env.SLACK_NOTIFICATIONS_ENABLED = undefined;
    process.env.SLACK_WEBHOOK_URL = undefined;
  });

  afterEach(() => {
    // Restore console and any timers
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;

    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns disabled result when notifications are not enabled", async () => {
    // Ensure NOT enabled
    process.env.SLACK_NOTIFICATIONS_ENABLED = undefined;
    vi.resetModules();

    const slackModule = await import("@/services/slackService");
    const slackService = slackModule.default;

    const result = await slackService.sendNotification({ text: "Hi" });
    expect(result).toEqual({
      success: true,
      message: "Notifications disabled",
    });
  });

  it("returns webhook-missing error when enabled but webhook not set", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "";
    vi.resetModules();

    const slackModule = await import("@/services/slackService");
    const slackService = slackModule.default;

    const result = await slackService.sendNotification({ text: "Hi" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Webhook URL missing");
  });

  it("succeeds when enabled and fetch responds ok", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const fetchMock = (await import("node-fetch")).default as unknown as vi.Mock;
    fetchMock.mockResolvedValue({ ok: true });

    const slackService = (await import("@/services/slackService")).default;

    const result = await slackService.sendNotification({ text: "Hello" });
    expect(result).toEqual({ success: true, message: "Notification sent" });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns Slack API error message when fetch responds not ok", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const fetchMock = (await import("node-fetch")).default as unknown as vi.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    const slackService = (await import("@/services/slackService")).default;

    const result = await slackService.sendNotification({ text: "Hello" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Slack API error: 500 Server Error");
  });

  it("returns error when fetch throws", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const fetchMock = (await import("node-fetch")).default as unknown as vi.Mock;
    fetchMock.mockRejectedValue(new Error("network down"));

    const slackService = (await import("@/services/slackService")).default;

    const result = await slackService.sendNotification({ text: "Hello" });
    expect(result.success).toBe(false);
    expect(result.message).toContain("network down");
  });

  it("retries sendNotification until success using sendNotificationWithRetry", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const slackService = (await import("@/services/slackService")).default;

    // Spy on sendNotification to simulate two failures then success
    const spy = vi
      .spyOn(slackService, "sendNotification")
      .mockResolvedValueOnce({ success: false, message: "fail 1" })
      .mockResolvedValueOnce({ success: false, message: "fail 2" })
      .mockResolvedValueOnce({ success: true, message: "ok" });

    // Use fake timers to advance past setTimeout delays without waiting
    vi.useFakeTimers();

    const promise = slackService.sendNotificationWithRetry({ text: "RetryMe" }, 3);
    // Attach a catch handler immediately to avoid unhandled rejection warnings in Node
    promise.catch(() => {
      /* swallowed for test */
    });

    // Fast-forward all timers so internal delays resolve
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.success).toBe(true);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("throws when all retry attempts throw errors", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const slackService = (await import("@/services/slackService")).default;

    // Make sendNotification reject every time but attach an immediate catch handler
    // to prevent an unhandled rejection warning from Node's process event loop.
    vi.spyOn(slackService, "sendNotification").mockImplementation(() => {
      const p = Promise.reject(new Error("critical failure"));
      // Attach a catch to avoid "UnhandledPromiseRejectionWarning" in Node
      p.catch(() => {});
      return p;
    });

    vi.useFakeTimers();

    const promise = slackService.sendNotificationWithRetry({ text: "Boom" }, 2);
    // Attach a catch handler immediately to avoid unhandled rejection warnings in Node
    promise.catch(() => {
      /* swallowed for test */
    });

    // Run timers to allow retries to happen
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow("critical failure");
  });

  it("notify* helper methods call sendNotificationWithRetry and return its result", async () => {
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";
    vi.resetModules();

    const slackService = (await import("@/services/slackService")).default;

    const fakeResult = { success: true, message: "ok" };
    const spy = vi.spyOn(slackService, "sendNotificationWithRetry").mockResolvedValue(fakeResult);

    const txData = {
      transaction: {
        transaction_num: 1,
        transaction_id: "t1",
        total_cost: 123.45,
        is_completed: true,
        is_reserved: false,
      },
      bike: {
        make: "Brand",
        model: "Model",
        condition: "New",
        price: 200,
      },
      customer: {
        first_name: "C",
        last_name: "D",
        email: "c@d.com",
      },
    };

    const r1 = await slackService.notifyBuildComplete(txData as any);
    expect(r1).toEqual(fakeResult);

    const r2 = await slackService.notifyReservationComplete(txData as any);
    expect(r2).toEqual(fakeResult);

    const r3 = await slackService.notifyTransactionComplete(txData as any);
    expect(r3).toEqual(fakeResult);

    const r4 = await slackService.notifyWorkflowStepComplete("Inspection", txData as any);
    expect(r4).toEqual(fakeResult);

    expect(spy).toHaveBeenCalledTimes(4);
  });

  it("safeLogger.warn calls server logger when available and falls back to console.warn when not", async () => {
    vi.resetModules();
    const fakeLogger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() };
    const mod = await import("@/services/slackService");
    const { safeLogger } = mod as any;

    // Use test hook to simulate server logger
    safeLogger._testLogger = fakeLogger;
    safeLogger.warn("test-warn");
    expect(fakeLogger.warn.mock.calls.length > 0).toBe(true);

    // Remove test hook to force console fallback and spy on console.warn
    safeLogger._testLogger = undefined;
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    safeLogger.warn("test-warn-2");
    expect(consoleWarn.mock.calls.length > 0).toBe(true);
    consoleWarn.mockRestore();
  });

  it("safeLogger.info calls server logger when available and falls back to console.log when not", async () => {
    vi.resetModules();
    const fakeLogger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() };
    const mod = await import("@/services/slackService");
    const { safeLogger } = mod as any;

    safeLogger._testLogger = fakeLogger;
    safeLogger.info("test-info");
    expect(fakeLogger.info.mock.calls.length > 0).toBe(true);

    safeLogger._testLogger = undefined;
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    safeLogger.info("test-info-2");
    expect(consoleLog.mock.calls.length > 0).toBe(true);
    consoleLog.mockRestore();
  });

  it("safeLogger.error calls server logger when available and falls back to console.error when not", async () => {
    vi.resetModules();
    const fakeLogger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() };
    const mod = await import("@/services/slackService");
    const { safeLogger } = mod as any;

    safeLogger._testLogger = fakeLogger;
    safeLogger.error("test-error");
    expect(fakeLogger.error.mock.calls.length > 0).toBe(true);

    safeLogger._testLogger = undefined;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    safeLogger.error("test-error-2");
    expect(consoleError.mock.calls.length > 0).toBe(true);
    consoleError.mockRestore();
  });

  it("notify helpers build payloads with appropriate fallback values", async () => {
    vi.resetModules();
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_WEBHOOK_URL = "https://example.test/hook";

    const slack = (await import("@/services/slackService")).default;
    const spy2 = vi.spyOn(slack, "sendNotificationWithRetry").mockResolvedValue({ success: true, message: "ok" });

    const txNoData = {
      transaction: {
        transaction_num: 99,
        transaction_id: "tx-99",
        total_cost: 50,
        is_completed: false,
        is_reserved: false,
      },
    };

    // Build complete (no bike/customer)
    await slack.notifyBuildComplete(txNoData as any);
    const payload1 = spy2.mock.calls[spy2.mock.calls.length - 1][0];
    const fields1 = (payload1.attachments?.[0]?.fields ?? []).map((f: any) => f.value).join(" ");
    expect(fields1).toMatch(/Unknown bike/);
    expect(fields1).toMatch(/No customer assigned/);

    // Reservation complete (no bike/customer)
    await slack.notifyReservationComplete(txNoData as any);
    const payload2 = spy2.mock.calls[spy2.mock.calls.length - 1][0];
    const fields2 = (payload2.attachments?.[0]?.fields ?? []).map((f: any) => f.value).join(" ");
    expect(fields2).toMatch(/Unknown bike/);
    expect(fields2).toMatch(/Unknown customer/);

    // Transaction complete (price formatting & unknown customer)
    await slack.notifyTransactionComplete(txNoData as any);
    const payload3 = spy2.mock.calls[spy2.mock.calls.length - 1][0];
    const fields3 = (payload3.attachments?.[0]?.fields ?? []).map((f: any) => f.value).join(" ");
    expect(fields3).toMatch(/\$50\.00/);
    expect(fields3).toMatch(/Unknown customer/);
  });
});
