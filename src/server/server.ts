import { Application, Request, Response, NextFunction } from "express";
import { config } from "../config";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { logger } from "../utils/logger";
import '../middleware/ensureLogsDir';

export class Server {
  constructor(private app: Application) {
    this.config();
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
}
