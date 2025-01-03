import express from "express";
import { config } from "./config";
import { logger } from "./utils/logger";
import { Server } from "./server/server";
import { routes } from "./routes";

const app = express();
const server = new Server(app);

// Routes
app.use(config.api.prefix, routes);

// Start server
const httpServer = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal. Starting graceful shutdown...');
  
  try {
    await server.closeConnections();
    httpServer.close(() => {
      logger.info('Server closed successfully');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});
