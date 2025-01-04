import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateNotification } from '../middleware/notification.validator';
import { BaseRoute } from './route.base';

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
 *         - message
 *         - type
 *       properties:
 *         message:
 *           type: string
 *           description: The notification message
 *         type:
 *           type: string
 *           enum: [info, warning, error]
 *           description: The type of notification
 *         metadata:
 *           type: object
 *           description: Additional metadata for the notification
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
 *
 * /notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, warning, error]
 *         description: Filter notifications by type
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
  public path = '/notifications';
  public router = Router();
  private readonly controller = NotificationController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Create notification
    this.router.post(
      `${this.path}/notify`,
      validateNotification,
      this.controller.createNotification
    );

    // Get notifications with filters
    this.router.get(
      this.path,
      this.controller.getNotifications
    );
  }
}
