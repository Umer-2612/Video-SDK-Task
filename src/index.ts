import App from "./server/app";
import { config } from "./config";
import { logger } from "./utils/logger";

const app = new App();

// Start server
app.start(config.port);

// Graceful shutdown handling
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal. Starting graceful shutdown...");
  try {
    // Add any cleanup logic here
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});
