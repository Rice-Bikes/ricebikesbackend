export interface NotificationConfig {
  slack: {
    webhookUrl: string;
    enabled: boolean;
    channelOverride?: string;
    retryAttempts: number;
    timeoutMs: number;
  };
}

const config: NotificationConfig = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || "",
    enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === "true",
    channelOverride: process.env.SLACK_CHANNEL_OVERRIDE,
    retryAttempts: Number.parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || "3"),
    timeoutMs: Number.parseInt(process.env.NOTIFICATION_TIMEOUT_MS || "5000"),
  },
};

export default config;
