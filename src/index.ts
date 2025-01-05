import express from "express";
import { config } from "./config";
import { Server } from "./server/server";
import { routes } from "./routes";
import { setupSwagger } from "./swagger";
import { HomeRoutes } from "./routes/home.routes";
import { logger } from "./utils/logger";

const app = express();
const server = new Server(app);
const homeRoutes = new HomeRoutes();

// Setup Swagger before routes
setupSwagger(app);

// Routes
app.use(config.api.prefix, routes);
app.use(homeRoutes.path, homeRoutes.router);
app.use("/health", async (_, res) => {
  try {
    res.status(200).json({ status: "healthy" });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Health check failed",
    });
  }
});

// Default route for root path
app.get("/", (_req, res) => {
  res.redirect("/docs");
});

// Start server
const httpServer = app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
  logger.info(
    `API Documentation available at http://localhost:${config.port}/docs`
  );
  logger.info(
    `API Base URL: http://localhost:${config.port}${config.api.prefix}`
  );
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Received shutdown signal. Starting graceful shutdown...");

  try {
    await server.closeConnections();
    httpServer.close(() => {
      logger.info("Server closed successfully");
      process.exit(0);
    });
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});
