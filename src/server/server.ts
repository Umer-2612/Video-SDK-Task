import { Application, Request, Response, NextFunction } from "express";
import { config } from "../config";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { logger } from "../utils/logger";
import "../middleware/ensureLogsDir";
import { MongoDBConnection } from "../database/mongodb.connection";

export class Server {
  private readonly mongodb = MongoDBConnection.getInstance();

  constructor(private app: Application) {
    this.config();
    this.initializeMongoDB();
  }

  private async initializeMongoDB(): Promise<void> {
    try {
      await this.mongodb.connect();
    } catch (error) {
      logger.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  }

  private config(): void {
    // Request logging
    this.app.use(logger.createRequestLogger());

    // Security Middleware
    this.app.use(helmet());

    // CORS
    this.app.use(cors());

    // Compression
    this.app.use(compression());

    // Log requests in development
    if (config.env === "development") {
      this.app.use((req: Request, _res: Response, next: NextFunction) => {
        logger.debug(`API Request`, {
          method: req.method,
          url: req.url,
          query: req.query,
          body: req.body,
        });
        next();
      });
    }
  }

  public async closeConnections(): Promise<void> {
    await this.mongodb.disconnect();
  }
}
