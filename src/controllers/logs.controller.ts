import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { HttpException } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

export class LogsController {
  private static instance: LogsController;
  private readonly logsDir: string;

  private constructor() {
    // Use environment variable for logs directory or default
    this.logsDir = process.env.LOG_DIR || path.join(__dirname, "../../logs");
    this.ensureLogsDirectory();
  }

  private async ensureLogsDirectory(): Promise<void> {
    try {
      await fs.access(this.logsDir);
    } catch (error) {
      logger.info(`Creating logs directory at ${this.logsDir}`);
      await fs.mkdir(this.logsDir, { recursive: true });
    }
  }

  public static getInstance(): LogsController {
    if (!LogsController.instance) {
      LogsController.instance = new LogsController();
    }
    return LogsController.instance;
  }

  public getDailyLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const date =
        (req.query.date as string) || new Date().toISOString().split("T")[0];
      const logFileName = `${date}-app.log`;
      const logFilePath = path.join(this.logsDir, logFileName);

      logger.debug(`Attempting to read logs from ${logFilePath}`);

      try {
        const logContent = await fs.readFile(logFilePath, "utf-8");
        const logs = logContent
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch (error) {
              logger.warn(`Failed to parse log line: ${line}`);
              return null;
            }
          })
          .filter(Boolean); // Remove null entries

        res.json({
          date,
          logs,
        });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          logger.debug(`No log file found for date ${date}`);
          res.json({
            date,
            logs: [],
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error("Error retrieving logs:", error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(500, "Error retrieving logs");
    }
  };

  public getAvailableDates = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      logger.debug(`Scanning logs directory: ${this.logsDir}`);
      const files = await fs.readdir(this.logsDir);
      
      const dates = files
        .filter((file) => file.endsWith("-app.log"))
        .map((file) => file.replace("-app.log", ""))
        .sort()
        .reverse();

      res.json(dates);
    } catch (error) {
      logger.error("Error getting available log dates:", error);
      throw new HttpException(500, "Error retrieving log dates");
    }
  };
}
