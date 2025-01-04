import { Router } from "express";
import { BaseRoute } from "./route.base";
import { LogsController } from "../controllers/logs.controller";

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Application logs management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LogEntry:
 *       type: object
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: The time when the log was created
 *         level:
 *           type: string
 *           enum: [info, warn, error]
 *           description: Log level
 *         message:
 *           type: string
 *           description: Log message
 *         metadata:
 *           type: object
 *           description: Additional log metadata
 */

/**
 * @swagger
 * /logs/daily:
 *   get:
 *     summary: Get logs for a specific date
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to fetch logs for (YYYY-MM-DD). Defaults to today
 *     responses:
 *       200:
 *         description: List of log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LogEntry'
 * 
 * /logs/dates:
 *   get:
 *     summary: Get list of available log dates
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: List of dates with available logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-04"
 */
export class LogsRoutes extends BaseRoute {
  public path = "/logs";
  public router = Router();
  private readonly controller = LogsController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Get logs for a specific date (defaults to today)
    this.router.get("/daily", this.controller.getDailyLogs);

    // Get list of available log dates
    this.router.get("/dates", this.controller.getAvailableDates);
  }
}
