import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationStatus:
 *       type: string
 *       enum:
 *         - pending
 *         - queued
 *         - processing
 *         - sent
 *         - delivered
 *         - read
 *         - failed
 *         - cancelled
 *
 *     NotificationType:
 *       type: string
 *       enum:
 *         - email
 *         - push
 *         - sms
 *         - webhook
 *
 *     NotificationPriority:
 *       type: string
 *       enum:
 *         - low
 *         - medium
 *         - high
 *         - urgent
 *
 *     NotificationCategory:
 *       type: string
 *       enum:
 *         - marketing
 *         - system
 *         - security
 *
 *     NotificationCreate:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - category
 *         - title
 *         - content
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user to notify
 *         type:
 *           $ref: '#/components/schemas/NotificationType'
 *         category:
 *           $ref: '#/components/schemas/NotificationCategory'
 *         priority:
 *           $ref: '#/components/schemas/NotificationPriority'
 *           default: medium
 *         title:
 *           type: string
 *           description: Notification title
 *           maxLength: 200
 *         content:
 *           type: string
 *           description: Notification content
 *           maxLength: 1000
 *         templateId:
 *           type: string
 *           description: Optional template ID to use
 *         templateData:
 *           type: object
 *           description: Data to populate the template with
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *           description: When to send the notification
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the notification expires
 *         batchId:
 *           type: string
 *           description: ID for batch processing
 *         groupId:
 *           type: string
 *           description: ID for grouping related notifications
 *
 *     Notification:
 *       allOf:
 *         - $ref: '#/components/schemas/NotificationCreate'
 *         - type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: Notification ID
 *             status:
 *               $ref: '#/components/schemas/NotificationStatus'
 *             deliveryAttempts:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     $ref: '#/components/schemas/NotificationStatus'
 *                   error:
 *                     type: string
 *                   provider:
 *                     type: string
 *                   metadata:
 *                     type: object
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *             sentAt:
 *               type: string
 *               format: date-time
 *             deliveredAt:
 *               type: string
 *               format: date-time
 *             readAt:
 *               type: string
 *               format: date-time
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
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - category
 *               - title
 *               - content
 *               - message
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to receive the notification
 *               type:
 *                 type: string
 *                 enum: [email, sms, push]
 *                 description: Type of notification (must be enabled for the user)
 *               category:
 *                 type: string
 *                 enum: [marketing, system, security]
 *                 description: Category of the notification
 *               title:
 *                 type: string
 *                 description: Title of the notification
 *               content:
 *                 type: string
 *                 description: Detailed content of the notification
 *               message:
 *                 type: string
 *                 description: Short message for the notification
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the notification
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: When to send the notification (must be in the future)
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the notification expires
 *           examples:
 *             basic:
 *               value:
 *                 userId: "user123"
 *                 type: "email"
 *                 category: "system"
 *                 title: "Account Security Update"
 *                 content: "We noticed a login from a new device. Please verify if this was you."
 *                 message: "New device login detected on your account"
 *                 metadata:
 *                   deviceType: "iPhone"
 *                   location: "San Francisco, CA"
 *             scheduled:
 *               value:
 *                 userId: "user456"
 *                 type: "sms"
 *                 category: "marketing"
 *                 title: "Appointment Reminder"
 *                 content: "Your doctor's appointment is scheduled for tomorrow at 2 PM"
 *                 message: "Reminder: Doctor appointment tomorrow 2 PM"
 *                 scheduledFor: "2025-01-06T08:30:00.000Z"
 *                 expiresAt: "2025-01-06T14:30:00.000Z"
 *     responses:
 *       202:
 *         description: Notification accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Notification accepted for processing"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 message:
 *                   type: string
 *                   example: "Invalid notification data"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [
 *                     "category is required",
 *                     "Invalid notification type",
 *                     "Invalid notification category"
 *                   ]
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications with filters
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/NotificationType'
 *         description: Filter by notification type
 *       - in: query
 *         name: category
 *         schema:
 *           $ref: '#/components/schemas/NotificationCategory'
 *         description: Filter by notification category
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/NotificationStatus'
 *         description: Filter by notification status
 *       - in: query
 *         name: priority
 *         schema:
 *           $ref: '#/components/schemas/NotificationPriority'
 *         description: Filter by priority
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (from)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (to)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
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
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
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
    // Create notification
    this.router.post("/", this.controller.createNotification);

    // Get notifications with filters
    this.router.get("/", this.controller.getNotifications);
  }
}
