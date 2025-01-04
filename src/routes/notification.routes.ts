import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { validateNotification } from "../middleware/notification.validator";
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
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - type
 *         - title
 *         - content
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user to notify
 *         type:
 *           type: string
 *           enum: [email, push, sms]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         content:
 *           type: string
 *           description: Notification content
 *         metadata:
 *           type: object
 *           description: Additional metadata
 */

/**
 * @swagger
 * /notifications/notify:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Notification'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
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
    this.router.post(
      "/notify",
      validateNotification,
      this.controller.createNotification
    );

    // Get notifications with filters
    this.router.get("/", this.controller.getNotifications);
  }
}
