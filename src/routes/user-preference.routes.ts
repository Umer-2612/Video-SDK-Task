import { Router } from "express";
import { UserPreferenceController } from "../controllers/user-preferences.controller";
import { BaseRoute } from "./route.base";

/**
 * @swagger
 * tags:
 *   name: User Preferences
 *   description: Manage user preferences including notification settings and other customizations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationChannel:
 *       type: object
 *       required:
 *         - enabled
 *       properties:
 *         enabled:
 *           type: boolean
 *           description: Whether this notification channel is enabled
 *           example: true
 *         quietHours:
 *           type: object
 *           description: Time period during which notifications should not be sent
 *           properties:
 *             start:
 *               type: string
 *               format: HH:mm
 *               description: Start time of quiet hours (24-hour format)
 *               example: "22:00"
 *             end:
 *               type: string
 *               format: HH:mm
 *               description: End time of quiet hours (24-hour format)
 *               example: "07:00"
 *     UserPreferences:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user these preferences belong to
 *           example: "user123"
 *         notifications:
 *           type: object
 *           properties:
 *             email:
 *               $ref: '#/components/schemas/NotificationChannel'
 *             sms:
 *               $ref: '#/components/schemas/NotificationChannel'
 *             push:
 *               $ref: '#/components/schemas/NotificationChannel'
 *         categories:
 *           type: object
 *           description: Preferences for different notification categories
 *           additionalProperties:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Whether notifications for this category are enabled
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, push]
 *                 description: Preferred channels for this category
 *         theme:
 *           type: string
 *           enum: [light, dark, system]
 *           description: User's preferred UI theme
 *           example: "system"
 *         language:
 *           type: string
 *           description: User's preferred language (ISO 639-1 code)
 *           example: "en"
 *         timezone:
 *           type: string
 *           description: User's timezone (IANA timezone identifier)
 *           example: "Asia/Kolkata"
 */

/**
 * @swagger
 * /user-preferences/{userId}:
 *   get:
 *     summary: Get user preferences
 *     tags: [User Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       404:
 *         description: User preferences not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update user preferences
 *     tags: [User Preferences]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: User preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPreferences'
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User preferences not found
 *       500:
 *         description: Server error
 */

export class UserPreferenceRoutes extends BaseRoute {
  public path = "/user-preferences";
  public router = Router();
  private readonly controller = UserPreferenceController.getInstance();

  constructor() {
    super();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get("/:userId", this.controller.getUserPreferences);
    this.router.put("/:userId", this.controller.updateUserPreferences);
  }
}
