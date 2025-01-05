import { NotificationModel } from "../models/notification.model";
import {
  NotificationStatus,
  NotificationPriority,
  INotification
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";
import KafkaService, { KafkaTopics } from "./kafka.service";

export class NotificationAggregatorService {
  private static instance: NotificationAggregatorService;
  private aggregatorInterval: NodeJS.Timeout | null = null;
  private aggregationQueue: Map<string, INotification[]> = new Map();

  private constructor() {}

  public static getInstance(): NotificationAggregatorService {
    if (!NotificationAggregatorService.instance) {
      NotificationAggregatorService.instance = new NotificationAggregatorService();
    }
    return NotificationAggregatorService.instance;
  }

  public async addToAggregationQueue(notification: INotification): Promise<void> {
    try {
      const hourKey = this.getHourKey(notification.scheduledFor || new Date());
      const userKey = `${notification.userId}:${hourKey}`;
      
      if (!this.aggregationQueue.has(userKey)) {
        this.aggregationQueue.set(userKey, []);
      }
      
      this.aggregationQueue.get(userKey)?.push(notification);
      
      // Update notification status
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.AGGREGATED
      });
      
      logger.info(`Added notification ${notification._id} to aggregation queue`);
    } catch (error) {
      logger.error("Failed to add notification to aggregation queue:", error);
      throw error;
    }
  }

  public startAggregator(intervalMs: number = 300000): void { // Run every 5 minutes
    if (this.aggregatorInterval) {
      return;
    }

    this.aggregatorInterval = setInterval(async () => {
      await this.processAggregationQueue();
    }, intervalMs);

    logger.info("Notification aggregator started");
  }

  public stopAggregator(): void {
    if (this.aggregatorInterval) {
      clearInterval(this.aggregatorInterval);
      this.aggregatorInterval = null;
      logger.info("Notification aggregator stopped");
    }
  }

  private async processAggregationQueue(): Promise<void> {
    try {
      const now = new Date();
      const currentHourKey = this.getHourKey(now);

      for (const [userKey, notifications] of this.aggregationQueue.entries()) {
        const [userId, hourKey] = userKey.split(':');
        
        // Only process notifications for past or current hour
        if (hourKey > currentHourKey) {
          continue;
        }

        if (notifications.length > 0) {
          await this.createAggregatedNotification(userId, notifications);
          this.aggregationQueue.delete(userKey);
        }
      }
    } catch (error) {
      logger.error("Error in notification aggregator:", error);
    }
  }

  private async createAggregatedNotification(
    userId: string,
    notifications: INotification[]
  ): Promise<void> {
    try {
      // Create summary message
      const summary = this.createSummaryMessage(notifications);

      // Create new aggregated notification
      const aggregatedNotification = new NotificationModel({
        userId,
        message: summary,
        type: notifications[0].type,
        priority: NotificationPriority.LOW,
        status: NotificationStatus.PENDING,
        scheduledFor: notifications[0].scheduledFor,
        aggregatedFrom: notifications.map(n => n._id)
      });

      await aggregatedNotification.save();

      // Publish to Kafka for delivery
      await KafkaService.publish({
        topic: KafkaTopics.AGGREGATED,
        messages: [{
          value: JSON.stringify(aggregatedNotification)
        }]
      });

      // Update original notifications
      await NotificationModel.updateMany(
        { _id: { $in: notifications.map(n => n._id) } },
        {
          status: NotificationStatus.AGGREGATED,
          aggregatedInto: aggregatedNotification._id
        }
      );

      logger.info(`Created aggregated notification ${aggregatedNotification._id} from ${notifications.length} notifications`);
    } catch (error) {
      logger.error("Failed to create aggregated notification:", error);
      throw error;
    }
  }

  private createSummaryMessage(notifications: INotification[]): string {
    const totalCount = notifications.length;
    const types = new Set(notifications.map(n => n.type));
    const typeStr = Array.from(types).join(", ");

    return `You have ${totalCount} pending ${typeStr} notifications:\n\n` +
      notifications.map(n => `- ${n.message}`).join("\n");
  }

  private getHourKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
  }
}

export default NotificationAggregatorService.getInstance();
