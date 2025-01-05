import { NotificationModel } from "../models/notification.model";
import {
  INotification,
  NotificationStatus,
  NotificationPriority,
} from "../interfaces/notification.interface";
import { logger } from "../utils/logger";

interface AggregatedNotification {
  notifications: INotification[];
  userId: string;
  type: string;
  category: string;
  scheduledHour: Date;
}

export class NotificationAggregationService {
  private static instance: NotificationAggregationService;

  private constructor() {
    // Start the aggregation process
    this.startAggregationScheduler();
  }

  public static getInstance(): NotificationAggregationService {
    if (!NotificationAggregationService.instance) {
      NotificationAggregationService.instance =
        new NotificationAggregationService();
    }
    return NotificationAggregationService.instance;
  }

  private startAggregationScheduler(): void {
    // Run every hour
    setInterval(() => {
      this.aggregateAndProcessNotifications().catch((error) => {
        logger.error("Error in notification aggregation:", error);
      });
    }, 60 * 60 * 1000); // Every hour
  }

  private async aggregateAndProcessNotifications(): Promise<void> {
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000);

    try {
      // Find all low-priority notifications scheduled for the next hour
      const notifications = await NotificationModel.find({
        priority: NotificationPriority.LOW,
        status: NotificationStatus.SCHEDULED,
        scheduledFor: {
          $gte: currentHour,
          $lt: nextHour,
        },
      });

      if (notifications.length === 0) {
        return;
      }

      // Group notifications by user, type, and category
      const groups = this.groupNotifications(notifications);

      // Process each group
      for (const group of groups) {
        await this.processAggregatedGroup(group);
      }

      logger.info("Notification aggregation completed", {
        hour: currentHour,
        groupsProcessed: groups.length,
        totalNotifications: notifications.length,
      });
    } catch (error) {
      logger.error("Error aggregating notifications:", error);
    }
  }

  private groupNotifications(
    notifications: INotification[]
  ): AggregatedNotification[] {
    const groups = new Map<string, AggregatedNotification>();

    for (const notification of notifications) {
      const key = `${notification.userId}-${notification.type}-${notification.category}`;

      if (!groups.has(key)) {
        groups.set(key, {
          notifications: [],
          userId: notification.userId,
          type: notification.type,
          category: notification.category,
          scheduledHour: notification.scheduledFor!,
        });
      }

      groups.get(key)!.notifications.push(notification);
    }

    return Array.from(groups.values());
  }

  private async processAggregatedGroup(
    group: AggregatedNotification
  ): Promise<void> {
    try {
      if (group.notifications.length === 1) {
        // If only one notification, no need to aggregate
        return;
      }

      // Create aggregated notification content
      const summary = this.createAggregatedSummary(group);

      // Create new aggregated notification
      const aggregatedNotification = new NotificationModel({
        userId: group.userId,
        type: group.type,
        category: group.category,
        priority: NotificationPriority.LOW,
        title: `${group.category} Summary`,
        content: summary,
        status: NotificationStatus.PENDING,
        scheduledFor: group.scheduledHour,
        metadata: {
          isAggregated: true,
          originalNotificationIds: group.notifications.map((n) => n._id),
        },
      });

      await aggregatedNotification.save();

      // Update original notifications
      const notificationIds = group.notifications.map((n) => n._id);
      await NotificationModel.updateMany(
        { _id: { $in: notificationIds } },
        {
          $set: {
            status: NotificationStatus.AGGREGATED,
            metadata: {
              aggregatedInto: aggregatedNotification._id,
            },
          },
        }
      );

      logger.info("Created aggregated notification", {
        aggregatedId: aggregatedNotification._id,
        originalCount: group.notifications.length,
        userId: group.userId,
        type: group.type,
      });
    } catch (error) {
      logger.error("Error processing aggregated group:", error);
    }
  }

  private createAggregatedSummary(group: AggregatedNotification): string {
    const { notifications, category } = group;

    // Group similar notifications
    const summaryGroups = new Map<string, number>();
    for (const notification of notifications) {
      const key = notification.content;
      summaryGroups.set(key, (summaryGroups.get(key) || 0) + 1);
    }

    // Create summary text
    let summary = `You have ${
      notifications.length
    } ${category.toLowerCase()} notifications:\n\n`;

    for (const [content, count] of summaryGroups.entries()) {
      if (count > 1) {
        summary += `• (${count}x) ${content}\n`;
      } else {
        summary += `• ${content}\n`;
      }
    }

    return summary;
  }
}
