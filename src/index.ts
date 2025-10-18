/**
 * Rice Bikes Backend Server Entry Point
 *
 * This file initializes the server and sets up process handlers.
 */
import { env } from "@/common/utils/envConfig";
import { logger, serverLogger } from "@/common/utils/logger";
import { runMigrations } from "@/db/client";
import { setupMetrics } from "@/instrumentation/metrics";
import { app } from "@/server";

// Startup sequence
async function startServer() {
  try {
    serverLogger.info("Starting Rice Bikes Backend server");

    // Setup metrics endpoint and middleware before server starts
    serverLogger.debug("Setting up metrics collection");
    setupMetrics(app);

    // Check if we need to run migrations
    if (env.RUN_MIGRATIONS_ON_START === "true") {
      try {
        serverLogger.info("Running database migrations");
        await runMigrations();
        serverLogger.info("Database migrations completed successfully");
      } catch (error) {
        serverLogger.error({ error }, "Failed to run migrations, but continuing server startup");
      }
    }

    // Start listening for requests
    const server = app.listen(env.PORT, () => {
      const { NODE_ENV, HOST, PORT } = env;
      serverLogger.info(`Server (${NODE_ENV}) running at http://${HOST}:${PORT}`);
    });

    // Set up graceful shutdown
    const onCloseSignal = () => {
      serverLogger.info("Shutdown signal received, closing server");
      server.close(() => {
        serverLogger.info("Server closed successfully");
        process.exit(0);
      });
      // Force shutdown after 10s if graceful shutdown fails
      setTimeout(() => {
        serverLogger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000).unref();
    };

    // Register shutdown handlers
    process.on("SIGINT", onCloseSignal);
    process.on("SIGTERM", onCloseSignal);

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      serverLogger.error({ error: error.message, stack: error.stack }, "Uncaught exception");
    });

    process.on("unhandledRejection", (reason) => {
      serverLogger.error({ reason: String(reason) }, "Unhandled promise rejection");
    });
  } catch (error) {
    serverLogger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.fatal({ error: error.message, stack: error.stack }, "Fatal error during server startup");
  process.exit(1);
});
