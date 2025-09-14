import { logger } from "@/server";
import fetch from "node-fetch";

interface SlackAttachment {
  color?: string;
  fields?: {
    title: string;
    value: string;
    short?: boolean;
  }[];
  footer?: string;
  ts?: number;
}

interface SlackMessage {
  text: string;
  username?: string;
  icon_emoji?: string;
  attachments?: SlackAttachment[];
}

interface SlackResponse {
  success: boolean;
  message: string;
}

interface TransactionData {
  transaction: {
    transaction_num: number;
    transaction_id: string;
    total_cost: number;
    is_completed: boolean;
    is_reserved: boolean;
  };
  bike?: {
    make: string;
    model: string;
    condition: "New" | "Refurbished" | "Used";
    price?: number;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

class SlackService {
  private webhookUrl: string;
  private enabled: boolean;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || "";
    if (this.webhookUrl === "") {
      console.warn("SLACK_WEBHOOK_URL is not set. Slack notifications will be disabled.");
    }
    this.enabled = process.env.SLACK_NOTIFICATIONS_ENABLED === "true";
    if (!this.enabled) {
      logger.warn("Slack notifications are disabled.");
    }
  }

  async sendNotification(payload: SlackMessage): Promise<SlackResponse> {
    if (!this.enabled) {
      console.log("Slack notifications disabled");
      return { success: true, message: "Notifications disabled" };
    }

    if (!this.webhookUrl) {
      console.error("Slack webhook URL not configured");
      return { success: false, message: "Webhook URL missing" };
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      console.log("Slack notification sent successfully");
      return { success: true, message: "Notification sent" };
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
      return { success: false, message: (error as Error).message };
    }
  }

  async sendNotificationWithRetry(payload: SlackMessage, maxAttempts = 3): Promise<SlackResponse> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.sendNotification(payload);
        if (result.success) return result;

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      } catch (error) {
        console.error(`Slack notification attempt ${attempt} failed:`, (error as Error).message);

        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    return { success: false, message: "All retry attempts failed" };
  }

  // Specific notification methods
  async notifyBuildComplete(transactionData: TransactionData): Promise<SlackResponse> {
    const { transaction, bike, customer } = transactionData;

    const bikeInfo = bike ? `${bike.make} ${bike.model} (${bike.condition})` : "Unknown bike";

    const customerInfo = customer ? `${customer.first_name} ${customer.last_name}` : "No customer assigned";

    const message: SlackMessage = {
      text: "🚴 Bike Build Complete!",
      username: "Rice Bikes Bot",
      icon_emoji: ":bike:",
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num?.toString() || "Unknown",
              short: true,
            },
            {
              title: "Bike",
              value: bikeInfo,
              short: true,
            },
            {
              title: "Customer",
              value: customerInfo,
              short: false,
            },
          ],
          footer: "Ready for inspection and safety check! 🔧✅",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotificationWithRetry(message);
  }

  async notifyReservationComplete(transactionData: TransactionData): Promise<SlackResponse> {
    const { transaction, bike, customer } = transactionData;

    const bikeInfo = bike ? `${bike.make} ${bike.model}` : "Unknown bike";
    const customerInfo = customer ? `${customer.first_name} ${customer.last_name}` : "Unknown customer";

    const message: SlackMessage = {
      text: "📋 Bike Reserved!",
      username: "Rice Bikes Bot",
      icon_emoji: ":clipboard:",
      attachments: [
        {
          color: "warning",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num?.toString() || "Unknown",
              short: true,
            },
            {
              title: "Customer",
              value: customerInfo,
              short: true,
            },
            {
              title: "Bike",
              value: bikeInfo,
              short: false,
            },
            {
              title: "Deposit",
              value: "$50.00",
              short: true,
            },
          ],
          footer: "Customer deposit processed",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotificationWithRetry(message);
  }

  async notifyTransactionComplete(transactionData: TransactionData): Promise<SlackResponse> {
    const { transaction, bike, customer } = transactionData;

    const customerInfo = customer ? `${customer.first_name} ${customer.last_name}` : "Unknown customer";

    const message: SlackMessage = {
      text: "💰 Sale Complete!",
      username: "Rice Bikes Bot",
      icon_emoji: ":money_with_wings:",
      attachments: [
        {
          color: "#36a64f",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num?.toString() || "Unknown",
              short: true,
            },
            {
              title: "Final Price",
              value: `$${transaction.total_cost?.toFixed(2) || "0.00"}`,
              short: true,
            },
            {
              title: "Customer",
              value: customerInfo,
              short: false,
            },
          ],
          footer: "Bike successfully sold! 🎉",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotificationWithRetry(message);
  }

  async notifyWorkflowStepComplete(stepName: string, transactionData: TransactionData): Promise<SlackResponse> {
    const { transaction, bike, customer } = transactionData;

    const bikeInfo = bike ? `${bike.make} ${bike.model}` : "Unknown bike";
    const customerInfo = customer ? `${customer.first_name} ${customer.last_name}` : "Unknown customer";

    const message: SlackMessage = {
      text: `✅ Workflow Step Complete: ${stepName}`,
      username: "Rice Bikes Bot",
      icon_emoji: ":white_check_mark:",
      attachments: [
        {
          color: "#0066cc",
          fields: [
            {
              title: "Transaction #",
              value: transaction.transaction_num?.toString() || "Unknown",
              short: true,
            },
            {
              title: "Step",
              value: stepName,
              short: true,
            },
            {
              title: "Bike",
              value: bikeInfo,
              short: true,
            },
            {
              title: "Customer",
              value: customerInfo,
              short: true,
            },
          ],
          footer: "Workflow progress updated",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    return await this.sendNotificationWithRetry(message);
  }
}

export default new SlackService();
