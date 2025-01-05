import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { errorHandler } from "./shared/middleware/error.middleware";
import { appConfig } from "./shared/config/app.config";
import { notificationRoutes } from "./services/notification-ingestion/src/api/routes";

export class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors(appConfig.cors));

    // Request parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Compression
    this.app.use(compression());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    // Notification routes
    this.app.use(appConfig.api.prefix, notificationRoutes);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public start(): void {
    const port = appConfig.api.port;
    this.app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(
        `📚 API docs available at http://localhost:${port}${appConfig.api.prefix}/docs`
      );
      console.log(
        `🔔 Notification endpoint: http://localhost:${port}${appConfig.api.prefix}/notify`
      );
    });
  }
}

// Start server
if (require.main === module) {
  const server = new Server();
  server.start();
}
