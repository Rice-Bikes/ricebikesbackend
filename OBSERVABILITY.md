# Observability options for Rice Bikes backend

Goal: provide free or low-cost observability options so you can get consistent uptime notifications, local metrics + dashboards, logs, and traces — and a clear, minimal implementation path.

Checklist
- [ ] Uptime/synthetic checks (external monitors + status alerts)
- [ ] Metrics collection (application and system metrics)
- [ ] Dashboards (local Grafana or Grafana Cloud free tier)
- [ ] Logs collection and centralized query (Loki)
- [ ] Distributed tracing (OpenTelemetry -> Jaeger/Tempo)
- [ ] Alerting (Prometheus Alertmanager or Grafana Alerts)
- [ ] Quick start (docker-compose + minimal Node instrumentation samples)

Summary of free options

1) Uptime/Synthetic monitoring for private/internal services
- UptimeKuma (self-hosted): a free, open-source monitor you run inside the same private network. Supports HTTP/HTTPS, TCP, ICMP, and has built-in alerting channels (email, Telegram, Slack webhooks).
- Healthchecks (self-hosted): excellent for cron/heartbeat checks when run internally.
- GitHub Actions self-hosted runner: run scheduled synthetic tests from inside your network (useful for deeper transaction flows). This keeps checks internal and avoids exposing endpoints.
- If you have controlled outbound-only egress, you can still use external monitors (UptimeRobot, Healthchecks.io hosted) by having an agent or a small secure relay that exposes only a health endpoint to the monitor.

Recommendation: Run UptimeKuma or self-hosted Healthchecks inside the private network; add a GitHub Actions self-hosted runner for scheduled transaction tests when you need richer checks.

2) Metrics + dashboards (self-hosted / open-source, internal)
- Prometheus for metrics scraping, run it inside the private network.
- Grafana for dashboards and alerts (self-hosted Grafana is recommended for private networks).
- Node instrumentation: `prom-client` (npm) exposes `/metrics` endpoint for Prometheus.
- Exporters: `node_exporter` (host metrics), `postgres_exporter` (Postgres metrics) — run them internally and scrape from your internal Prometheus.

Recommendation: Run Prometheus + Grafana inside the same private network (Docker Compose or k8s). If you need cloud features, use Grafana Agent to remote_write (only outbound) to Grafana Cloud — but keep primary data in your internal systems.

3) Logs (structured logs + centralized query, internal-first)
- Pino (already used) configured to JSON output to stdout or to files.
- Grafana Loki + promtail for log collection — run Loki inside your private network and run promtail as an agent on each host or sidecar in containers.
- Alternative: self-hosted Elasticsearch + Kibana (heavier) or forward sampled logs out-of-band if you need cloud retention.

Recommendation: Keep logs inside the private network using promtail -> Loki and query from Grafana. If you need external retention/analysis, use an agent with sampled forwarding.

4) Tracing (distributed traces, internal)
- OpenTelemetry (opentelemetry-js) for instrumentation (automatic + manual).
- OTLP Collector: run an OpenTelemetry Collector inside your network to receive OTLP traces and export to Jaeger/Tempo or to a central storage.
- Jaeger (self-hosted) or Grafana Tempo for storage/visualization — run internally.

Recommendation: Instrument with OpenTelemetry SDK and send traces to a local Collector + Jaeger. Use sampling at the Collector to limit storage.

5) Alerting (internal-first)
- Prometheus Alertmanager (self-hosted) — run in-network and configure routes for email, PagerDuty, Slack (incoming webhook), or internal webhooks.
- Grafana unified alerting (self-hosted) is a UI-friendly alternative.

Recommendation: Run Alertmanager internally. For external notification channels (Slack, PagerDuty, email) the Alertmanager needs outbound access to those services — if outbound is blocked, integrate with an internal notification relay (e.g., internal webhook that forwards to external services) or send to an internal Ops channel (email/Mattermost/Matrix).


6) Hosted free-tier alternatives (only if controlled outbound is allowed)
- Grafana Cloud: useful if you can run a Grafana Agent or Collector with outbound-only egress; retention and bandwidth limits apply.
- Honeycomb / Lightstep: require outbound egress and API keys.
- Logflare: requires outbound egress from an agent.

Minimal implementation plan (local/dev quickly reproducible)

1) App instrumentation (Express + TypeScript)

- Metrics: add `prom-client` and expose `/metrics`

Example (add in `src/server.ts` or a metrics module):

```ts
import express from 'express';
import client from 'prom-client';

const register = client.register;
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// collect default node metrics
client.collectDefaultMetrics();

export function metricsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: String(res.statusCode) });
  });
  next();
}

// mount route
const app = express();
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

- Logs: configure `pino` to log JSON (already used) and write to stdout so promtail/loki can pick it up.

Example pino config snippet (app setup):

```ts
import pino from 'pino';
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
export default logger;
```

- Traces: add OpenTelemetry auto-instrumentation

```bash
npm install @opentelemetry/sdk-node @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express @opentelemetry/exporter-jaeger
```

Minimal `tracing.ts` bootstrap:

```ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces' }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

Start tracing before app imports (import early in `src/index.ts`).

2) Local observability stack (docker-compose, internal deployment)

Create a `docker-compose.observability.yml` with Prometheus, Grafana, Loki, Promtail, Jaeger. Example minimal config (internal hostnames assumed):
```yaml
version: '3.7'
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./observability/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
  - 9090:9090

  grafana:
    image: grafana/grafana:latest
    ports:
  - 3000:3000
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  loki:
    image: grafana/loki:2.8.2
    ports:
      - 3100:3100

  promtail:
    image: grafana/promtail:2.8.2
    volumes:
  - /var/log:/var/log
  - ./observability/promtail/config.yml:/etc/promtail/config.yml

  jaeger:
    image: jaegertracing/all-in-one:1.41
    ports:
      - 16686:16686
      - 14268:14268
```

Prometheus scrape config should include your app `/metrics` endpoint and node exporters.

Prometheus should use internal DNS hostnames or IPs for targets (for example `ricebikes-app.internal:3000` or `10.0.1.23:3000`). If services are containerized on the same compose network, use service names.

3) Alerting
- Add `alertmanager` with configuration and integrate with Prometheus.
- Configure alerts for: instance down, high error rate, high latency, high CPU.
- Route to email + Slack (Slack via incoming webhook).

4) Quick verification steps

Run local stack:

```bash
# from repo root
docker compose -f docker-compose.observability.yml up -d
```

- Visit Grafana: http://localhost:3000 (admin/admin)
- Visit Prometheus: http://localhost:9090
- Visit Jaeger: http://localhost:16686
- Hit an endpoint of your app and then open `/metrics` in Prometheus targets


5) Cost-free monitoring shortcuts (private networks)

- UptimeKuma (self-hosted) for internal HTTP/TCP/ICMP monitoring and alerting.
- Self-hosted Healthchecks for cron/heartbeat checks.
- GitHub Actions self-hosted runner to run smoke tests inside the private network and POST results to internal Alertmanager or create issues when failures occur.

6) Small checklist of actionable changes to repo (PR-ready)
- [ ] Add `src/instrumentation/metrics.ts` and mount `/metrics` route
- [ ] Add `src/instrumentation/tracing.ts` and import early in `src/index.ts`
- [ ] Ensure `pino` logs JSON to stdout
- [ ] Add `docker-compose.observability.yml` and `observability/` configs (prometheus.yml, promtail config)
- [ ] Add README (`OBSERVABILITY.md`) with links and run instructions (this file)
- [ ] Add Prometheus Alertmanager config for basic alerts

Notes & tradeoffs
- Self-hosting (Prometheus/Grafana/Loki/Jaeger) gives full control and is free if you host on an existing VM. It requires maintenance and storage planning.
- Grafana Cloud free tier is easiest to start with remote dashboards and alerts but has retention limits.
- Logs + traces can become large quickly; set retention/volume limits and sample traces.
- Use structured logging (JSON) and semantic metric names for long term maintainability.

Further reading / links
- Prometheus: https://prometheus.io/
- Grafana + Loki: https://grafana.com/
- OpenTelemetry: https://opentelemetry.io/
- UptimeRobot: https://uptimerobot.com/
- Healthchecks: https://healthchecks.io/

-- End of file

## Footprint analysis (storage / CPU / network considerations)

This section gives order-of-magnitude guidance so you can plan storage, CPU, and networking for an internal observability stack. Exact numbers depend on traffic, retention windows, and sampling. The goal here is to provide conservative starting estimates and knobs to control cost.

Assumptions
- Small production app: ~100 req/s peak, 10k unique metric series (labels + per-route), 1–5 GB logs/day, 0.5–2M traces/day (before sampling).
- Internal retention targets: metrics 15d, logs 7d, traces 7d (adjustable).

Prometheus (TSDB) footprint
- Ingest: each sample ~ 1-2 bytes per series per scrape interval. With 10k series scraped every 15s -> ~10k * (86_400/15) samples/day ≈ 57.6M samples/day. At ~1.5 bytes/sample stored (after compression) -> ~86 MB/day raw; multiply by historical retention and WAL overhead.
- Disk: for 15 days retention, estimate 86 MB/day * 15 ≈ 1.3 GB + overhead → plan for 3–5 GB to be safe on small nodes.
- CPU: scrape and local query load is moderate; a 1–2 vCPU instance is typically fine for small deployments.

Grafana
- Storage: dashboards and metadata are small (tens of MB). Grafana needs little disk; plugins and caching may increase usage. Plan 1–2 GB.
- CPU: UI usage determines CPU; 1 vCPU is usually enough for small teams.

Loki (logs)
- Ingest: structured JSON logs are larger. If you write 1–5 GB logs/day, Loki with compression can store the logs but index size depends on label cardinality.
- Disk: plan raw storage 1–5 GB/day. For 7d retention, plan 7–35 GB; add head / indexes -> reserve 2x -> 14–70 GB.
- CPU: promtail/log ingestion is lightweight; Loki query load determines CPU. Start with 2 vCPU and scale based on query patterns.

Jaeger/Traces
- Traces are high-cardinality. Sample aggressively (1–10%) at high traffic.
- Storage: raw traces can be several bytes per span; plan to sample down so storage for 7d retention is manageable. For our assumed traffic, sampled traces (1–5%) could be ~5–50 GB/day before compression; use sampling.
- CPU: collector/ingesters can be modest for sampled traces; 2–4 vCPU if ingesting traces at volume.

Network
- If all services are internal, network egress is minimal. Allocate 10–100 Mbps depending on your metric/log/trace aggregation buffer and backup patterns.
- If you remote_write to cloud, ensure you have reliable outbound bandwidth; consider batching and compression.

Retention knobs & cost controls
- Reduce scrape frequency for rarely changing metrics
- Aggregate labels to reduce metric series cardinality
- Use trace sampling at the SDK or Collector
- Use log sampling or limit logging level in production
- Use retention policies (Prometheus TSDB, Loki retention) and tombstone/archive old data

Monitoring budget starter (example)
- Small VM (2 vCPU, 4 GB RAM, 50 GB disk) running Prometheus + Grafana for dev/testing — ok for very small workloads
- Medium VM (4 vCPU, 8–16 GB RAM, 200 GB disk) recommended for small production with logs and traces

Final notes
- These are conservative starting points; measure actual usage with initial deployment and iterate retention and sampling.
- If you want, I can add a sample `observability/footprint-estimates.md` with a simple script to compute these numbers from real metrics (rate of series, log bytes/day, traces/day).

---

End of Observability guide
