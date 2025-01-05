import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { NotificationPreferenceModel } from "../models/notification-preference.model";
import { UserModel } from "../models/user.model";
import {
  NotificationStatus,
  NotificationPriority,
  NotificationType,
  INotificationCreate,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";
import kafkaService from "../services/kafka.service";
import { NotificationProcessorService } from "../services/notification-processor.service";

interface KafkaNotificationMessage {
  notificationId: string;
  priority: NotificationPriority;
  type: NotificationType;
  userId: string;
}

const NOTIFICATION_TOPIC = "notifications";

export class NotificationController {
  private static instance: NotificationController;
  private readonly processorService: NotificationProcessorService;

  private constructor() {
    this.processorService = NotificationProcessorService.getInstance();
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

  private async processNotification(
    message: KafkaNotificationMessage
  ): Promise<void> {
    try {
      const { notificationId } = message;

      // Fetch notification from database
      const notification = await NotificationModel.findById(notificationId);
      if (!notification) {
        logger.error(`Notification not found: ${notificationId}`);
        return;
      }

      // Process notification using the processor service
      await this.processorService.processNotification(notification);
    } catch (error) {
      logger.error("Error processing notification from Kafka:", error);
    }
  }
}
