import { NotificationModel } from "../models/notification.model";
import { NotificationPreferenceModel } from "../models/notification-preference.model";
import { logger } from "../utils/logger";
import {
  INotification,
  NotificationStatus,
  NotificationPriority,
  NotificationType,
} from "../interfaces/notification.interface";
import { INotificationPreference } from "../interfaces/notification-preference.interface";
import { DeduplicationService } from "./deduplication.service";
import { NotificationDeliveryService } from "./notification-delivery.service";

export class NotificationProcessorService {
  private static instance: NotificationProcessorService;
  private readonly deduplicationService: DeduplicationService;
  private readonly deliveryService: NotificationDeliveryService;

  private constructor() {
    this.deduplicationService = DeduplicationService.getInstance();
    this.deliveryService = NotificationDeliveryService.getInstance();
  }

  public static getInstance(): NotificationProcessorService {
    if (!NotificationProcessorService.instance) {
      NotificationProcessorService.instance =
        new NotificationProcessorService();
    }
    return NotificationProcessorService.instance;
  }

  public async processNotification(notification: INotification): Promise<void> {
    try {
      // Check for duplicates first
      if (await this.deduplicationService.isDuplicate(notification)) {
        await this.markNotificationDuplicate(notification);
        return;
      }

      const preferences = await NotificationPreferenceModel.findOne({
        userId: notification.userId,
      });

      if (!preferences) {
        logger.error(
          `User preferences not found for user: ${notification.userId}`
        );
        await this.markNotificationFailed(
          notification,
          "User preferences not found"
        );
        return;
      }

      // Check if notification type is enabled
      if (!preferences.channels[notification.type]?.enabled) {
        await this.markNotificationFailed(
          notification,
          `${notification.type} notifications are disabled`
        );
        return;
      }

      // Process based on priority and scheduling
      if (this.isHighPriority(notification)) {
        await this.processHighPriorityNotification(notification);
      } else {
        await this.processStandardNotification(notification, preferences);
      }
    } catch (error) {
      logger.error("Error processing notification:", error);
      await this.markNotificationFailed(notification, "Processing error");
    }
  }

  private async processHighPriorityNotification(
    notification: INotification
  ): Promise<void> {
    // High priority notifications bypass quiet hours and rate limits
    await this.deliveryService.deliverNotification(notification);
  }

  private async processStandardNotification(
    notification: INotification,
    preferences: INotificationPreference
  ): Promise<void> {
    // Check quiet hours
    if (this.isInQuietHours(preferences, notification.type)) {
      await this.scheduleForNextActiveHour(notification, preferences);
      return;
    }

    // Check rate limits
    if (await this.isRateLimitExceeded(notification, preferences)) {
      await this.handleRateLimitExceeded(notification, preferences);
      return;
    }

    // For low priority notifications, schedule them for aggregation
    if (notification.priority === NotificationPriority.LOW) {
      await this.scheduleLowPriorityNotification(notification);
      return;
    }

    // Process notification
    await this.deliveryService.deliverNotification(notification);
  }

  private isHighPriority(notification: INotification): boolean {
    return (
      notification.priority === NotificationPriority.HIGH ||
      notification.priority === NotificationPriority.URGENT
    );
  }

  private isInQuietHours(
    preferences: INotificationPreference,
    channel: NotificationType
  ): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Check global quiet hours
    if (preferences.globalQuietHours?.enabled) {
      const globalStart = this.timeToMinutes(
        preferences.globalQuietHours.start
      );
      const globalEnd = this.timeToMinutes(preferences.globalQuietHours.end);
      if (this.isTimeInRange(currentTime, globalStart, globalEnd)) {
        return true;
      }
    }

    // Check channel-specific quiet hours
    const channelPrefs = preferences.channels[channel];
    if (channelPrefs?.quietHours) {
      const start = this.timeToMinutes(channelPrefs.quietHours.start);
      const end = this.timeToMinutes(channelPrefs.quietHours.end);
      return this.isTimeInRange(currentTime, start, end);
    }

    return false;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 100 + minutes;
  }

  private isTimeInRange(time: number, start: number, end: number): boolean {
    if (start <= end) {
      return time >= start && time <= end;
    } else {
      // Handle overnight ranges (e.g., 22:00 to 06:00)
      return time >= start || time <= end;
    }
  }

  private async isRateLimitExceeded(
    notification: INotification,
    preferences: INotificationPreference
  ): Promise<boolean> {
    const channelPrefs = preferences.channels[notification.type];
    const hourlyLimit =
      channelPrefs?.limits?.hourly ?? preferences.globalLimits?.hourly;
    const dailyLimit =
      channelPrefs?.limits?.daily ?? preferences.globalLimits?.daily;

    if (!hourlyLimit && !dailyLimit) {
      return false;
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyCount, dailyCount] = await Promise.all([
      NotificationModel.countDocuments({
        userId: notification.userId,
        type: notification.type,
        status: NotificationStatus.DELIVERED,
        createdAt: { $gte: hourAgo },
      }),
      NotificationModel.countDocuments({
        userId: notification.userId,
        type: notification.type,
        status: NotificationStatus.DELIVERED,
        createdAt: { $gte: dayAgo },
      }),
    ]);

    return (
      (hourlyLimit ? hourlyCount >= hourlyLimit : false) ||
      (dailyLimit ? dailyCount >= dailyLimit : false)
    );
  }

  private async handleRateLimitExceeded(
    notification: INotification,
    _preferences: INotificationPreference
  ): Promise<void> {
    // Schedule for next hour if hourly limit is exceeded
    const nextDeliveryTime = new Date();
    nextDeliveryTime.setHours(nextDeliveryTime.getHours() + 1);
    nextDeliveryTime.setMinutes(0);
    nextDeliveryTime.setSeconds(0);

    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.QUEUED,
      scheduledFor: nextDeliveryTime,
    });

    logger.info("Notification rescheduled due to rate limit", {
      notificationId: notification._id,
      nextDeliveryTime,
    });
  }

  private async scheduleForNextActiveHour(
    notification: INotification,
    preferences: INotificationPreference
  ): Promise<void> {
    const nextActiveTime = this.calculateNextActiveTime(
      preferences,
      notification.type
    );

    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.QUEUED,
      scheduledFor: nextActiveTime,
    });

    logger.info("Notification scheduled for next active hour", {
      notificationId: notification._id,
      nextActiveTime,
    });
  }

  private calculateNextActiveTime(
    preferences: INotificationPreference,
    channel: NotificationType
  ): Date {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Check global quiet hours
    if (preferences.globalQuietHours?.enabled) {
      const globalEnd = this.timeToMinutes(preferences.globalQuietHours.end);
      if (currentTime < globalEnd) {
        const nextTime = new Date();
        const [hours, minutes] = preferences.globalQuietHours.end
          .split(":")
          .map(Number);
        nextTime.setHours(hours, minutes, 0, 0);
        return nextTime;
      }
    }

    // Check channel-specific quiet hours
    const channelPrefs = preferences.channels[channel];
    if (channelPrefs?.quietHours) {
      const end = this.timeToMinutes(channelPrefs.quietHours.end);
      if (currentTime < end) {
        const nextTime = new Date();
        const [hours, minutes] = channelPrefs.quietHours.end
          .split(":")
          .map(Number);
        nextTime.setHours(hours, minutes, 0, 0);
        return nextTime;
      }
    }

    // If not in quiet hours, schedule for next hour
    const nextTime = new Date();
    nextTime.setHours(nextTime.getHours() + 1, 0, 0, 0);
    return nextTime;
  }

  private async scheduleLowPriorityNotification(
    notification: INotification
  ): Promise<void> {
    // Schedule for the next hour boundary
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0, 0, 0);

    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.SCHEDULED,
      scheduledFor: nextHour,
    });

    logger.info("Low priority notification scheduled for aggregation", {
      notificationId: notification._id,
      scheduledFor: nextHour,
    });
  }

  private async markNotificationDuplicate(
    notification: INotification
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.CANCELLED,
      $push: {
        deliveryAttempts: {
          timestamp: new Date(),
          status: NotificationStatus.CANCELLED,
          error: "Duplicate notification detected",
        },
      },
    });
  }

  private async markNotificationFailed(
    notification: INotification,
    reason: string
  ): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.FAILED,
      $push: {
        deliveryAttempts: {
          timestamp: new Date(),
          status: NotificationStatus.FAILED,
          error: reason,
        },
      },
    });
  }
}
