import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import {
  NotificationStatus,
  INotificationCreate,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";
import kafkaService from "../services/kafka.service";
import { NotificationProcessorService } from "../services/notification-processor.service";
import { NotificationValidationService } from "../services/notification-validation.service";

interface KafkaNotificationMessage {
  notificationData: INotificationCreate;
}

const NOTIFICATION_TOPIC = "notifications";

export class NotificationController {
  private static instance: NotificationController;
  private readonly processorService: NotificationProcessorService;
  private readonly validationService: NotificationValidationService;

  private constructor() {
    this.processorService = NotificationProcessorService.getInstance();
    this.validationService = NotificationValidationService.getInstance();
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
          await this.processKafkaMessage(message);
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

      // Validate notification data
      const validationResult =
        await this.validationService.validateNotification(notificationData);
      if (!validationResult.isValid) {
        res.status(400).json({
          status: "error",
          errors: validationResult.errors,
        });
        return;
      }

      // Send to Kafka for processing
      const kafkaMessage: KafkaNotificationMessage = {
        notificationData,
      };

      await kafkaService.produce(NOTIFICATION_TOPIC, kafkaMessage);

      logger.info("Notification sent to processing queue", {
        userId: notificationData.userId,
        type: notificationData.type,
      });

      res.status(202).json({
        status: "success",
        message: "Notification accepted for processing",
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  private async processKafkaMessage(
    message: KafkaNotificationMessage
  ): Promise<void> {
    try {
      const { notificationData } = message;

      // Create notification record
      const notification = new NotificationModel({
        ...notificationData,
        status: NotificationStatus.PENDING,
        deliveryAttempts: [],
      });
      await notification.save();

      logger.info("Notification created from Kafka message", {
        notificationId: notification._id,
        userId: notification.userId,
      });

      // Process notification using the processor service
      await this.processorService.processNotification(notification);
    } catch (error) {
      logger.error("Error processing notification from Kafka:", error);
    }
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
