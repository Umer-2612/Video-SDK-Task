import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

interface IConfig {
  port: number;
  env: string;
  api: {
    prefix: string;
    version: string;
  };
  cors: {
    origin: string;
  };
  security: {
    jwtSecret: string;
    jwtExpiration: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logs: {
    level: string;
  };
  database: {
    mongodb: {
      uri: string;
      options: {
        dbName: string;
      };
    };
  };
}

export class Config {
  private static instance: Config;
  private readonly config: IConfig;

  private constructor() {
    this.config = {
      port: parseInt(process.env.PORT || "3000", 10),
      env: process.env.NODE_ENV || "development",
      api: {
        prefix: process.env.API_PREFIX || "/api",
        version: process.env.API_VERSION || "v1",
      },
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
      },
      security: {
        jwtSecret:
          process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this",
        jwtExpiration: process.env.JWT_EXPIRATION || "1d",
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
      },
      logs: {
        level: process.env.LOG_LEVEL || "debug",
      },
      database: {
        mongodb: {
          uri:
            process.env.MONGODB_URI ||
            "mongodb://localhost:27017/notification-system",
          options: {
            dbName: process.env.MONGODB_DB_NAME || "notification-system",
          },
        },
      },
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public getConfig(): IConfig {
    return this.config;
  }
}

export const config = Config.getInstance().getConfig();
