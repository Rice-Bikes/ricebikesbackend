import type express from "express";
import client from "prom-client";

// Register and collect default Node metrics
const register = client.register;
client.collectDefaultMetrics();

// Histogram for HTTP request durations
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export function metricsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = (req.route && (req.route as any).path) || req.path;
    end({ method: req.method, route, status_code: String(res.statusCode) });
  });
  next();
}

export function setupMetrics(app: express.Express) {
  // Expose /metrics for Prometheus
  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (err) {
      res.status(500).send(err instanceof Error ? err.message : String(err));
    }
  });

  // Attach middleware to collect per-request histograms
  app.use(metricsMiddleware);
}
