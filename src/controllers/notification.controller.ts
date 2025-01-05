import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { UserPreferencesModel } from "../models/user-preferences.model";
import {
  NotificationStatus,
  NotificationPriority,
  INotificationCreate,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";
import { NotificationDeliveryService } from "../services/notification-delivery.service";
import { NotificationSchedulerService } from "../services/notification-scheduler.service";
import { NotificationAggregatorService } from "../services/notification-aggregator.service";
import KafkaService from "../services/kafka.service";
import { createHash } from "crypto";
import { Types } from "mongoose";

export class NotificationController {
  private static instance: NotificationController;
  private readonly deliveryService: NotificationDeliveryService;
  private readonly schedulerService: NotificationSchedulerService;
  private readonly aggregatorService: NotificationAggregatorService;
  private readonly kafkaService: typeof KafkaService;
  private readonly DEDUP_WINDOW_MS = 3600000; // 1 hour

  private constructor() {
    this.deliveryService = NotificationDeliveryService.getInstance();
    this.schedulerService = NotificationSchedulerService.getInstance();
    this.aggregatorService = NotificationAggregatorService.getInstance();
    this.kafkaService = KafkaService;

    // Start services
    this.schedulerService.startScheduler();
    this.aggregatorService.startAggregator();
  }

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  public async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationData: INotificationCreate = {
        ...req.body,
        userId: new Types.ObjectId(req.body.userId),
      };

      console.log({ aa: notificationData.userId });

      const userPrefstemp = await UserPreferencesModel.findOne({
        userId: notificationData.userId,
      });

      console.log({ userPrefstemp });

      // Check user preferences
      const userPrefs = await UserPreferencesModel.findOne({
        userId: notificationData.userId,
      });

      if (!userPrefs) {
        res.status(404).json({
          status: "error",
          message: "User preferences not found",
        });
        return;
      }

      // Check if the notification channel is enabled
      const channelKey = notificationData.type.toLowerCase();
      if (
        !(channelKey in userPrefs.notifications) ||
        !userPrefs.notifications[
          channelKey as keyof typeof userPrefs.notifications
        ].enabled
      ) {
        res.status(400).json({
          status: "error",
          message: "Notification channel is disabled for this user",
        });
        return;
      }

      // Generate content hash for deduplication
      const contentHash = this.generateContentHash(notificationData);

      // Check for duplicate notifications
      if (
        await this.isDuplicate(String(notificationData.userId), contentHash)
      ) {
        res.status(200).json({
          status: "success",
          message: "Similar notification already exists, skipped",
        });
        return;
      }

      // Create notification
      const notification = new NotificationModel({
        ...notificationData,
        status: NotificationStatus.PENDING,
        contentHash,
      });

      // Save notification
      await notification.save();

      // Publish to Kafka
      await this.kafkaService.publish({
        _id: notification._id,
        userId: notification.userId,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        scheduledFor: notification.scheduledFor,
        contentHash: notification.contentHash,
      });

      // Handle based on priority
      if (
        notification.priority === NotificationPriority.HIGH ||
        notification.priority === NotificationPriority.URGENT
      ) {
        // Process high-priority notifications immediately
        notification.status = NotificationStatus.PROCESSING;
        await notification.save();
        await this.deliveryService.deliverNotification(notification);
      } else if (notification.scheduledFor) {
        // Schedule for later delivery
        notification.status = NotificationStatus.SCHEDULED;
        await notification.save();
      } else {
        // Process normal priority notifications
        await this.deliveryService.deliverNotification(notification);
      }

      res.status(202).json({
        status: "success",
        message: "Notification processed successfully",
        data: { notificationId: notification._id },
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }

  private generateContentHash(data: INotificationCreate): string {
    const content = `${data.userId}|${data.message}|${data.type}`;
    return createHash("sha256").update(content).digest("hex");
  }

  private async isDuplicate(
    userId: string,
    contentHash: string
  ): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - this.DEDUP_WINDOW_MS);

    const existingNotification = await NotificationModel.findOne({
      userId,
      contentHash,
      createdAt: { $gte: oneHourAgo },
      status: { $ne: NotificationStatus.FAILED },
    });

    return !!existingNotification;
  }

  public async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        type,
        status,
        priority,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      const query: any = {};

      if (userId) query.userId = userId;
      if (type) query.type = type;
      if (status) query.status = status;
      if (priority) query.priority = priority;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) query.createdAt.$lte = new Date(endDate as string);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [notifications, total] = await Promise.all([
        NotificationModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        NotificationModel.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        status: "success",
        data: {
          notifications,
          pagination: {
            total,
            page: Number(page),
            pages: totalPages,
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching notifications:", error);
      res
        .status(500)
        .json({ status: "error", message: "Internal server error" });
    }
  }
}
