import { Router } from "express";
import { NotificationPreferenceController } from "../controllers/notification-preference.controller";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: Notification Preferences
 *   description: User notification preferences management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ChannelPreference:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Whether notifications are enabled for this channel
 *         quietHours:
 *           type: object
 *           properties:
 *             start:
 *               type: string
 *               format: HH:mm
 *               description: Start time of quiet hours (24-hour format)
 *             end:
 *               type: string
 *               format: HH:mm
 *               description: End time of quiet hours (24-hour format)
 *         limits:
 *           type: object
 *           properties:
 *             hourly:
 *               type: number
 *               description: Maximum notifications per hour
 *             daily:
 *               type: number
 *               description: Maximum notifications per day
 *     NotificationPreference:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         channels:
 *           type: object
 *           properties:
 *             email:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             sms:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             push:
 *               $ref: '#/components/schemas/ChannelPreference'
 *         globalQuietHours:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             start:
 *               type: string
 *               format: HH:mm
 *             end:
 *               type: string
 *               format: HH:mm
 *         globalLimits:
 *           type: object
 *           properties:
 *             hourly:
 *               type: number
 *             daily:
 *               type: number
 */

export class NotificationPreferenceRoutes extends BaseRoute {
  public path = "/notification-preferences";
  public router = Router();
  private readonly controller = NotificationPreferenceController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /notification-preferences/{userId}:
     *   get:
     *     summary: Get user notification preferences
     *     tags: [Notification Preferences]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User preferences retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/NotificationPreference'
     */
    this.router.get("/:userId", this.controller.getPreferences);

    /**
     * @swagger
     * /notification-preferences/{userId}:
     *   put:
     *     summary: Create or update user notification preferences
     *     tags: [Notification Preferences]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/NotificationPreference'
     *     responses:
     *       200:
     *         description: Preferences updated successfully
     */
    this.router.put("/:userId", this.controller.createOrUpdatePreferences);

    /**
     * @swagger
     * /notification-preferences/{userId}/channels/{channel}:
     *   put:
     *     summary: Update channel-specific preferences
     *     tags: [Notification Preferences]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: channel
     *         required: true
     *         schema:
     *           type: string
     *           enum: [email, sms, push]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ChannelPreference'
     *     responses:
     *       200:
     *         description: Channel preferences updated successfully
     */
    this.router.put(
      "/:userId/channels/:channel",
      this.controller.updateChannelPreferences
    );

    /**
     * @swagger
     * /notification-preferences/{userId}/quiet-hours:
     *   put:
     *     summary: Update quiet hours settings
     *     tags: [Notification Preferences]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               enabled:
     *                 type: boolean
     *               start:
     *                 type: string
     *                 format: HH:mm
     *               end:
     *                 type: string
     *                 format: HH:mm
     *     responses:
     *       200:
     *         description: Quiet hours updated successfully
     */
    this.router.put("/:userId/quiet-hours", this.controller.updateQuietHours);
  }
}
