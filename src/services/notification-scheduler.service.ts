import { NotificationModel } from "../models/notification.model";
import { UserPreferencesModel } from "../models/user-preferences.model";
import {
  NotificationStatus,
  NotificationPriority,
  INotification,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";
import KafkaService, { KafkaTopics } from "./kafka.service";

export class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private schedulerInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance =
        new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  public async scheduleForDelivery(notification: INotification): Promise<void> {
    try {
      // Update notification status
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.SCHEDULED,
      });

      // Publish to Kafka scheduled topic
      await KafkaService.publish({
        topic: KafkaTopics.SCHEDULED,
        messages: [
          {
            value: JSON.stringify(notification),
          },
        ],
      });

      logger.info(`Scheduled notification ${notification._id} for delivery`);
    } catch (error) {
      logger.error("Failed to schedule notification for delivery:", error);
      throw error;
    }
  }

  public startScheduler(intervalMs: number = 60000): void {
    if (this.schedulerInterval) {
      return;
    }

    this.schedulerInterval = setInterval(async () => {
      await this.processPendingNotifications();
    }, intervalMs);

    logger.info("Notification scheduler started");
  }

  public stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      logger.info("Notification scheduler stopped");
    }
  }

  private async processPendingNotifications(): Promise<void> {
    try {
      const now = new Date();

      // Find notifications that are scheduled and due
      const pendingNotifications = await NotificationModel.find({
        status: NotificationStatus.SCHEDULED,
        scheduledFor: { $lte: now },
      }).sort({ priority: -1, scheduledFor: 1 });

      for (const notification of pendingNotifications) {
        try {
          // Check user preferences
          const userPrefs = await UserPreferencesModel.findOne({
            userId: notification.userId,
          });

          if (!userPrefs) {
            continue;
          }

          // Check quiet hours
          if (
            this.isInQuietHours(userPrefs) &&
            notification.priority !== NotificationPriority.URGENT
          ) {
            // Reschedule for after quiet hours
            const nextActiveTime = this.getNextActiveTime(userPrefs);
            notification.scheduledFor = nextActiveTime;
            await notification.save();
            continue;
          }

          // Check notification limits
          if (
            !(await this.checkNotificationLimits(
              notification.userId.toString(),
              userPrefs
            ))
          ) {
            // Reschedule for next hour if limit exceeded
            notification.scheduledFor = this.getNextHour();
            await notification.save();
            continue;
          }

          // Process the notification
          notification.status = NotificationStatus.PROCESSING;
          await notification.save();

          // Publish to Kafka for delivery
          await KafkaService.publish({
            topic: KafkaTopics.NOTIFICATIONS,
            messages: [
              {
                value: JSON.stringify(notification),
              },
            ],
          });
        } catch (error) {
          logger.error("Error processing notification:", error);
          notification.status = NotificationStatus.FAILED;
          await notification.save();
        }
      }
    } catch (error) {
      logger.error("Error in notification scheduler:", error);
    }
  }

  private isInQuietHours(userPrefs: any): boolean {
    if (!userPrefs.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = userPrefs.quietHours.start
      .split(":")
      .map(Number);
    const [endHour, endMinute] = userPrefs.quietHours.end
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handle overnight quiet hours (e.g., 22:00 to 06:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private getNextActiveTime(userPrefs: any): Date {
    const now = new Date();
    const [endHour, endMinute] = userPrefs.quietHours.end
      .split(":")
      .map(Number);

    const nextActive = new Date(now);
    nextActive.setHours(endHour, endMinute, 0, 0);

    if (nextActive <= now) {
      nextActive.setDate(nextActive.getDate() + 1);
    }

    return nextActive;
  }

  private async checkNotificationLimits(
    userId: string,
    userPrefs: any
  ): Promise<boolean> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentCount = await NotificationModel.countDocuments({
      userId,
      status: NotificationStatus.SENT,
      sentAt: { $gte: hourAgo },
    });

    return recentCount < userPrefs.notificationLimits.hourlyLimit;
  }

  private getNextHour(): Date {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour;
  }
}

export default NotificationSchedulerService.getInstance();
