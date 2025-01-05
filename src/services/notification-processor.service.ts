import { EachMessagePayload } from "kafkajs";
import { logger } from "../utils/logger";
import { NotificationModel } from "../models/notification.model";
import { NotificationDeliveryService } from "./notification-delivery.service";
import { NotificationSchedulerService } from "./notification-scheduler.service";
import { NotificationAggregatorService } from "./notification-aggregator.service";
import KafkaService, { KafkaTopics, ConsumerGroups } from "./kafka.service";
import {
  INotification,
  NotificationStatus,
  NotificationPriority,
} from "../interfaces/notification.interface";

class NotificationProcessorService {
  private static instance: NotificationProcessorService;
  private readonly deliveryService: NotificationDeliveryService;
  private readonly schedulerService: NotificationSchedulerService;
  private readonly aggregatorService: NotificationAggregatorService;

  private constructor() {
    this.deliveryService = NotificationDeliveryService.getInstance();
    this.schedulerService = NotificationSchedulerService.getInstance();
    this.aggregatorService = NotificationAggregatorService.getInstance();

    this.initializeConsumers();
  }

  public static getInstance(): NotificationProcessorService {
    if (!NotificationProcessorService.instance) {
      NotificationProcessorService.instance = new NotificationProcessorService();
    }
    return NotificationProcessorService.instance;
  }

  private async initializeConsumers(): Promise<void> {
    try {
      // Subscribe to main notifications topic
      await KafkaService.subscribe(
        ConsumerGroups.PROCESSOR,
        [KafkaTopics.NOTIFICATIONS],
        async ({ message }: EachMessagePayload) => {
          const notification = JSON.parse(message.value?.toString() || "{}");
          await this.processNotification(notification);
        }
      );

      // Subscribe to scheduled notifications topic
      await KafkaService.subscribe(
        ConsumerGroups.SCHEDULER,
        [KafkaTopics.SCHEDULED],
        async ({ message }: EachMessagePayload) => {
          const notification = JSON.parse(message.value?.toString() || "{}");
          await this.processScheduledNotification(notification);
        }
      );

      // Subscribe to aggregated notifications topic
      await KafkaService.subscribe(
        ConsumerGroups.AGGREGATOR,
        [KafkaTopics.AGGREGATED],
        async ({ message }: EachMessagePayload) => {
          const notification = JSON.parse(message.value?.toString() || "{}");
          await this.processAggregatedNotification(notification);
        }
      );

      logger.info("Notification processor consumers initialized");
    } catch (error) {
      logger.error("Failed to initialize notification processor consumers:", error);
      throw error;
    }
  }

  private async processNotification(notification: INotification): Promise<void> {
    try {
      // Save notification to MongoDB
      const notificationDoc = new NotificationModel(notification);
      await notificationDoc.save();

      // Process based on priority and scheduling
      if (notification.scheduledFor && notification.priority !== NotificationPriority.URGENT) {
        if (notification.priority === NotificationPriority.LOW) {
          // Queue for aggregation if low priority
          await this.aggregatorService.addToAggregationQueue(notification);
        } else {
          // Schedule for later delivery
          await this.schedulerService.scheduleForDelivery(notification);
        }
      } else {
        // Process immediately
        await this.deliveryService.deliverNotification(notification);
      }
    } catch (error) {
      logger.error("Failed to process notification:", error);
      // Update notification status to failed
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.FAILED,
      });
    }
  }

  private async processScheduledNotification(notification: INotification): Promise<void> {
    try {
      if (notification.priority === NotificationPriority.LOW) {
        // Queue for aggregation if low priority
        await this.aggregatorService.addToAggregationQueue(notification);
      } else {
        // Deliver immediately
        await this.deliveryService.deliverNotification(notification);
      }
    } catch (error) {
      logger.error("Failed to process scheduled notification:", error);
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.FAILED,
      });
    }
  }

  private async processAggregatedNotification(notification: INotification): Promise<void> {
    try {
      // Deliver aggregated notification
      await this.deliveryService.deliverNotification(notification);
    } catch (error) {
      logger.error("Failed to process aggregated notification:", error);
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.FAILED,
      });
    }
  }
}

export default NotificationProcessorService.getInstance();
