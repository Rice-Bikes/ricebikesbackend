import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { bikesRouter } from "./api/bikes/bikesRouter";
import { customerRouter } from "./api/customer/customerRouter";
import { featureFlagsRouter } from "./api/featureFlags/featureFlagsRouter";
import { healthCheckRouter } from "./api/healthCheck/healthCheckRouter";
import { OrderRouter } from "./api/order/orderRouter";
import { permissionsRouter } from "./api/security/permissions/permissionRouter";
import { roleRouter } from "./api/security/roles/roleRouter";
import { userRouter } from "./api/security/users/userRouter";
import { summaryRouter } from "./api/summary/summaryRouter";
import { itemRouter } from "./api/transactionComponents/items/itemRouter";
import { OrderRequestsRouter } from "./api/transactionComponents/orderRequests/orderRequestsRouter";
import { repairRouter } from "./api/transactionComponents/repairs/repairRouter";
import { transactionDetailsRouter } from "./api/transactionComponents/transactionDetails/transactionDetailsRouter";
import { transactionLogsRouter } from "./api/transactionComponents/transactionLogs/transactionLogsRouter";
import { transactionRouter } from "./api/transactionComponents/transactions/transactionRouter";
const logger = pino({ name: "server start", level: "debug" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/transactions", transactionRouter);
app.use("/transactionDetails", transactionDetailsRouter);
app.use("/bikes", bikesRouter);
app.use("/customers", customerRouter);
app.use("/users", userRouter);
app.use("/items", itemRouter);
app.use("/repairs", repairRouter);
app.use("/summary", summaryRouter);
app.use("/orderRequests", OrderRequestsRouter);
app.use("/transactionLogs", transactionLogsRouter);
app.use("/roles", roleRouter);
app.use("/permissions", permissionsRouter);
app.use("/feature-flags", featureFlagsRouter);
app.use("/orders", OrderRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
