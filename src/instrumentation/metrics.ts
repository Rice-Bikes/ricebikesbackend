import type { Application, NextFunction, Request, Response } from "express";
import client from "prom-client";

const register = client.register;

// Default metrics (node process, heap, etc.)
client.collectDefaultMetrics({ register });

// Histogram for request durations
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export function setupMetrics(app: Application) {
  // Simple middleware to measure request durations
  app.use((req: Request, res: Response, next: NextFunction) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = (req.route && (req.route as any).path) || req.path;
      end({ method: req.method, route, status_code: String(res.statusCode) });
    });
    next();
  });

  // Expose /metrics
  app.get("/metrics", async (_req: Request, res: Response) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).send(String(err));
    }
  });
}
