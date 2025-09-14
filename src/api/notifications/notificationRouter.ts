import slackService from "@/services/slackService";
import { type Request, type Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

const router = Router();

// Rate limiting for notification endpoints
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: { error: "Too many notification requests from this IP" },
});

// Input validation middleware
const validateNotificationInput = [
  body("message").isString().isLength({ min: 1, max: 4000 }),
  body("type").optional().isIn(["manual", "auto"]),
];

// Manual Slack notification endpoint
router.post(
  "/slack-notification",
  notificationLimiter,
  validateNotificationInput,
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message, type = "manual" } = req.body;

      const payload = {
        text: message,
        username: "Rice Bikes Bot",
        icon_emoji: ":bike:",
      };

      const result = await slackService.sendNotification(payload);

      if (result.success) {
        res.json({
          success: true,
          message: "Notification sent successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      console.error("Slack notification endpoint error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },
);

// Test notification endpoint (development only)
router.post("/slack-test", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not available in production" });
  }

  try {
    const testMessage = {
      text: "🧪 Test notification from Rice Bikes system",
      username: "Rice Bikes Bot",
      icon_emoji: ":test_tube:",
      attachments: [
        {
          color: "warning",
          text: "This is a test notification to verify Slack integration is working.",
          footer: `Sent at ${new Date().toISOString()}`,
        },
      ],
    };

    const result = await slackService.sendNotification(testMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
