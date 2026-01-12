import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("notifications config", () => {
  it("reads values from environment variables", async () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.example/test";
    process.env.SLACK_NOTIFICATIONS_ENABLED = "true";
    process.env.SLACK_CHANNEL_OVERRIDE = "#channel";
    process.env.NOTIFICATION_RETRY_ATTEMPTS = "5";
    process.env.NOTIFICATION_TIMEOUT_MS = "2000";

    const mod = await import("@/config/notifications");
    const cfg = mod.default;

    expect(cfg.slack.webhookUrl).toBe("https://hooks.example/test");
    expect(cfg.slack.enabled).toBe(true);
    expect(cfg.slack.channelOverride).toBe("#channel");
    expect(cfg.slack.retryAttempts).toBe(5);
    expect(cfg.slack.timeoutMs).toBe(2000);
  });

  it("has sensible defaults when env variables are absent", async () => {
    process.env.SLACK_WEBHOOK_URL = undefined;
    process.env.SLACK_NOTIFICATIONS_ENABLED = undefined;
    process.env.SLACK_CHANNEL_OVERRIDE = undefined;
    process.env.NOTIFICATION_RETRY_ATTEMPTS = undefined;
    process.env.NOTIFICATION_TIMEOUT_MS = undefined;

    const mod = await import("@/config/notifications");
    const cfg = mod.default;

    expect(typeof cfg.slack.webhookUrl).toBe("string");
    expect(typeof cfg.slack.enabled).toBe("boolean");
    expect(typeof cfg.slack.retryAttempts).toBe("number");
    expect(typeof cfg.slack.timeoutMs).toBe("number");
  });
});
