import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();

/**
 * @swagger
 * /notify:
 *   post:
 *     summary: Send a new notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *     responses:
 *       202:
 *         description: Notification accepted
 *       400:
 *         description: Invalid request
 */
router.post('/notify', NotificationController.notify);

/**
 * @swagger
 * /notify/{id}:
 *   get:
 *     summary: Get notification status
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification status
 *       404:
 *         description: Notification not found
 */
router.get('/notify/:id', NotificationController.getStatus);

export const notificationRoutes = router;
