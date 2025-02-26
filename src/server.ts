import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { transactionRouter } from "@/api/transactions/transactionRouter";
import errorHandler from "@/common/middleware/errorHandler";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { bikesRouter } from "./api/bikes/bikesRouter";
import { customerRouter } from "./api/customer/customerRouter";
import { itemRouter } from "./api/items/itemRouter";
import { OrderRequestsRouter } from "./api/orderRequests/orderRequestsRouter";
import { repairRouter } from "./api/repairs/repairRouter";
import { summaryRouter } from "./api/summary/summaryRouter";
import { transactionDetailsRouter } from "./api/transactionDetails/transactionDetailsRouter";
import { transactionLogsRouter } from "./api/transactionLogs/transactionLogsRouter";
import { userRouter } from "./api/users/userRouter";

const logger = pino({ name: "server start" });
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

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
