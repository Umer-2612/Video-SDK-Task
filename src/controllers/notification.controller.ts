import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferenceModel } from "../models/notification-preference.model";
import { UserModel } from "../models/user.model";
import {
  NotificationStatus,
  NotificationPriority,
  NotificationType,
  INotificationCreate,
  INotification,
  INotificationDeliveryAttempt,
} from "../interfaces/notification.interface";
import { INotificationPreference } from "../interfaces/notification-preference.interface";
import { logger } from "../utils/logger";
import kafkaService from "../services/kafka.service";

interface KafkaNotificationMessage {
  notificationId: string;
  priority: NotificationPriority;
  type: NotificationType;
  userId: string;
}

const NOTIFICATION_TOPIC = "notifications";

export class NotificationController {
  private static instance: NotificationController;

  private constructor() {
    this.initializeKafka();
  }

  private async initializeKafka(): Promise<void> {
    try {
      await kafkaService.connect();
      await kafkaService.createTopic(NOTIFICATION_TOPIC);

      // Start consuming messages for processing
      await kafkaService.consume(
        NOTIFICATION_TOPIC,
        "notification-processor",
        async (message) => {
          await this.processNotification(message);
        }
      );
    } catch (error) {
      logger.error("Failed to initialize Kafka", error);
    }
  }

  public static getInstance(): NotificationController {
    if (!NotificationController.instance) {
      NotificationController.instance = new NotificationController();
    }
    return NotificationController.instance;
  }

  public createNotification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const notificationData: INotificationCreate = req.body;

      // Check if user exists
      const user = await UserModel.findOne({ userId: notificationData.userId });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Get user preferences
      const preferences = await NotificationPreferenceModel.findOne({
        userId: notificationData.userId,
      });

      // Check if user has enabled this notification type
      if (
        preferences &&
        !preferences.channels[notificationData.type]?.enabled
      ) {
        res.status(400).json({
          status: "error",
          message: `User has disabled ${notificationData.type} notifications`,
        });
        return;
      }

      // Create notification record
      const notification = new NotificationModel({
        ...notificationData,
        status: NotificationStatus.PENDING,
      });
      await notification.save();

      // Send to Kafka for processing
      const kafkaMessage: KafkaNotificationMessage = {
        notificationId: notification._id.toString(),
        priority: notification.priority,
        type: notification.type,
        userId: notification.userId,
      };

      await kafkaService.produce(NOTIFICATION_TOPIC, kafkaMessage);

      logger.info("Notification created successfully", {
        notificationId: notification._id,
        userId: notification.userId,
      });

      res.status(201).json({
        message: "Notification created successfully",
        notification,
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  private async processNotification(
    message: KafkaNotificationMessage
  ): Promise<void> {
    try {
      const { notificationId, priority } = message;

      // Fetch notification from database
      const notification = await NotificationModel.findById(notificationId);
      if (!notification) {
        logger.error(`Notification not found: ${notificationId}`);
        return;
      }

      // Get user preferences
      const preferences = await NotificationPreferenceModel.findOne({
        userId: notification.userId,
      });

      if (!preferences) {
        logger.error(
          `User preferences not found for user: ${notification.userId}`
        );
        return;
      }

      // Process based on priority
      if (
        priority === NotificationPriority.HIGH ||
        priority === NotificationPriority.URGENT
      ) {
        // Process immediately
        await this.deliverNotification(notification, preferences);
      } else {
        // Check quiet hours and other rules
        if (this.isWithinQuietHours(preferences)) {
          // Reschedule for after quiet hours
          notification.status = NotificationStatus.SCHEDULED;
          notification.scheduledTime = this.getNextActiveTime(preferences);
          await notification.save();

          logger.info(
            `Notification ${notificationId} rescheduled due to quiet hours`
          );
        } else {
          await this.deliverNotification(notification, preferences);
        }
      }
    } catch (error) {
      logger.error("Error processing notification:", error);
    }
  }

  private async deliverNotification(
    notification: INotification,
    preferences: INotificationPreference
  ): Promise<void> {
    try {
      // Update status to processing
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.PROCESSING,
      });

      // TODO: Implement actual delivery logic based on notification type and preferences
      let deliverySuccess = false;

      switch (notification.type) {
        case NotificationType.EMAIL:
          if (preferences.channels.email?.enabled) {
            // Implement email delivery
            deliverySuccess = true;
          }
          break;
        case NotificationType.SMS:
          if (preferences.channels.sms?.enabled) {
            // Implement SMS delivery
            deliverySuccess = true;
          }
          break;
        case NotificationType.PUSH:
          if (preferences.channels.push?.enabled) {
            // Implement push notification delivery
            deliverySuccess = true;
          }
          break;
        default:
          throw new Error(
            `Unsupported notification type: ${notification.type}`
          );
      }

      const deliveryAttempt: INotificationDeliveryAttempt = {
        timestamp: new Date(),
        status: deliverySuccess
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
        error: deliverySuccess ? undefined : "Failed to deliver notification",
      };

      // Update notification with delivery attempt
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: deliverySuccess
          ? NotificationStatus.SENT
          : NotificationStatus.FAILED,
        $push: { deliveryAttempts: deliveryAttempt },
      });

      if (deliverySuccess) {
        logger.info(`Notification ${notification._id} delivered successfully`);
      } else {
        logger.error(`Failed to deliver notification ${notification._id}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      logger.error(`Error delivering notification ${notification._id}:`, error);

      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.FAILED,
        $push: {
          deliveryAttempts: {
            timestamp: new Date(),
            status: NotificationStatus.FAILED,
            error: errorMessage,
          },
        },
      });
    }
  }

  private isWithinQuietHours(preferences: INotificationPreference): boolean {
    if (
      !preferences.schedules?.quietHours?.start ||
      !preferences.schedules?.quietHours?.end
    ) {
      return false;
    }

    const now = new Date();
    const [startHour, startMinute] = preferences.schedules.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = preferences.schedules.quietHours.end
      .split(":")
      .map(Number);

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const currentTime = currentHour * 60 + currentMinute;
    const quietStart = startHour * 60 + startMinute;
    const quietEnd = endHour * 60 + endMinute;

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime <= quietEnd;
    } else {
      // Handle case where quiet hours span midnight
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
  }

  private getNextActiveTime(preferences: INotificationPreference): Date {
    const now = new Date();

    if (!preferences.schedules?.quietHours?.end) {
      return now;
    }

    const [endHour, endMinute] = preferences.schedules.quietHours.end
      .split(":")
      .map(Number);
    const nextActive = new Date(now);

    nextActive.setHours(endHour, endMinute, 0, 0);
    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }

    return nextActive;
  }

  public getNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const {
        userId,
        type,
        category,
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
      if (category) query.category = category;
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

      res.status(200).json({
        status: "success",
        data: {
          notifications,
          pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching notifications", { error });
      res.status(500).json({
        status: "error",
        message: "Failed to fetch notifications",
      });
    }
  };
}
