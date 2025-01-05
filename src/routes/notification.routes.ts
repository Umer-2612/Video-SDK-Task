import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API endpoints for managing notifications including creation, retrieval, and status updates
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationType:
 *       type: string
 *       enum: [email, sms, push]
 *       description: The type of notification delivery channel
 *     NotificationPriority:
 *       type: string
 *       enum: [low, medium, high, urgent]
 *       description: Priority level of the notification
 *     NotificationStatus:
 *       type: string
 *       enum: [pending, processing, sent, failed, scheduled, delivered, read, queued, cancelled, aggregated]
 *       description: Current status of the notification in its lifecycle
 *     NotificationCreate:
 *       type: object
 *       required:
 *         - userId
 *         - message
 *         - type
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user this notification is for
 *           example: "65987d44d3e93c9b4e2c9a01"
 *         message:
 *           type: string
 *           description: The notification message content
 *           example: "Your order has been shipped"
 *         type:
 *           $ref: '#/components/schemas/NotificationType'
 *         priority:
 *           $ref: '#/components/schemas/NotificationPriority'
 *           default: "low"
 *     Notification:
 *       allOf:
 *         - $ref: '#/components/schemas/NotificationCreate'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: Unique identifier for the notification
 *               example: "507f1f77bcf86cd799439011"
 *             status:
 *               $ref: '#/components/schemas/NotificationStatus'
 *             scheduledFor:
 *               type: string
 *               format: date-time
 *               description: When the notification is scheduled to be sent
 *             sentAt:
 *               type: string
 *               format: date-time
 *               description: When the notification was sent
 *             deliveredAt:
 *               type: string
 *               format: date-time
 *               description: When the notification was delivered
 *             readAt:
 *               type: string
 *               format: date-time
 *               description: When the notification was read
 *             retryCount:
 *               type: number
 *               description: Number of retry attempts
 *               default: 0
 *             lastRetryAt:
 *               type: string
 *               format: date-time
 *               description: Last retry attempt timestamp
 *             contentHash:
 *               type: string
 *               description: Hash for deduplication
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Creation timestamp
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Last update timestamp
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCreate'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid request data or notification channel disabled
 *       404:
 *         description: User preferences not found
 *       500:
 *         description: Server error
 * 
 *   get:
 *     summary: Get notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to get notifications for
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/NotificationStatus'
 *         description: Filter by notification status
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/NotificationType'
 *         description: Filter by notification type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */

export class NotificationRoutes extends BaseRoute {
  public path = "/notifications";
  public router = Router();
  private readonly controller = NotificationController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/",
      this.controller.createNotification.bind(this.controller)
    );
    this.router.get(
      "/",
      this.controller.getNotifications.bind(this.controller)
    );
  }
}
