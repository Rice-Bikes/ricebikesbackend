import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly("test"),
    choices: ["development", "production", "test"],
  }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  LOG_LEVEL: str({
    default: "info",
    choices: ["fatal", "error", "warn", "info", "debug", "trace"],
  }),
  RUN_MIGRATIONS_ON_START: str({
    default: "false",
    choices: ["true", "false"],
  }),
  DATABASE_URL: str({
    desc: "PostgreSQL connection string",
    default: "postgresql://postgres:postgres@localhost:5432/ricebikes",
  }),
});
