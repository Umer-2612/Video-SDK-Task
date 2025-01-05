import { Router } from "express";
import { BaseRoute } from "./route.base";
import { LogsController } from "../controllers/logs.controller";

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: API endpoints for querying and managing notification system logs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LogLevel:
 *       type: string
 *       enum: [debug, info, warn, error]
 *       description: Severity level of the log entry
 *     LogEntry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the log entry
 *           example: "507f1f77bcf86cd799439011"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the log entry was created
 *         level:
 *           $ref: '#/components/schemas/LogLevel'
 *         message:
 *           type: string
 *           description: Log message content
 *         context:
 *           type: object
 *           description: Additional contextual information
 *           properties:
 *             notificationId:
 *               type: string
 *               description: Related notification ID if applicable
 *             userId:
 *               type: string
 *               description: Related user ID if applicable
 *             error:
 *               type: object
 *               description: Error details if this is an error log
 *         service:
 *           type: string
 *           description: Name of the service that generated the log
 *           example: "notification-service"
 */

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Query system logs
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           $ref: '#/components/schemas/LogLevel'
 *         description: Filter by log level
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for log query
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for log query
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *         description: Filter by service name
 *     responses:
 *       200:
 *         description: Successfully retrieved logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LogEntry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
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
