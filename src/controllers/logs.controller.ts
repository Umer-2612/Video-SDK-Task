import { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";
import { HttpException } from "../middleware/errorHandler";

export class LogsController {
  private static instance: LogsController;
  private readonly logsDir: string;

  private constructor() {
    this.logsDir = path.join(__dirname, "../../logs");
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

      try {
        const logContent = await fs.readFile(logFilePath, "utf-8");
        const logs = logContent
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => JSON.parse(line));

        res.json({
          date,
          logs,
        });
      } catch (error) {
        throw new HttpException(404, `No logs found for date ${date}`);
      }
    } catch (error) {
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
      const files = await fs.readdir(this.logsDir);
      const logDates = files
        .filter((file) => file.endsWith("-app.log"))
        .map((file) => file.replace("-app.log", ""))
        .sort()
        .reverse();

      res.json({
        dates: logDates,
      });
    } catch (error) {
      console.log({ error });
      throw new HttpException(500, "Error retrieving log dates");
    }
  };
}
