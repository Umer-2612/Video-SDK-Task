import { IValidatedNotification, NotificationPriority, NotificationStatus } from '../../../notification-ingestion/src/types/notification.types';
import { ThrottlingService } from '../rules/throttling.service';
import { QuietHoursService } from '../rules/quiet-hours.service';
import { DeduplicationService } from '../rules/deduplication.service';
import { AggregationService } from '../rules/aggregation.service';
import { NotificationSearchService } from '../storage/elasticsearch.service';
import { Notification } from '../models/notification.model';
import { UserPreferences } from '../models/user-preferences.model';

export class NotificationProcessor {
    public static async processNotification(notification: IValidatedNotification): Promise<IValidatedNotification> {
        try {
            // Store in MongoDB first
            await Notification.create(notification);

            // Store in Elasticsearch for search
            await NotificationSearchService.storeNotification(notification);

            // Check if it's a high-priority notification
            if (notification.priority === NotificationPriority.HIGH) {
                return await this.processUrgentNotification(notification);
            }

            // Check throttling
            const isThrottled = await ThrottlingService.checkThrottling(notification);
            if (!isThrottled) {
                notification.status = NotificationStatus.FAILED;
                await this.updateNotificationStatus(notification);
                return notification;
            }

            // Check quiet hours
            const inQuietHours = await QuietHoursService.isInQuietHours(notification);
            if (inQuietHours) {
                return await this.rescheduleNotification(notification);
            }

            // Check for duplicates
            const isDuplicate = await DeduplicationService.isDuplicate(notification);
            if (isDuplicate) {
                notification.status = NotificationStatus.FAILED;
                await this.updateNotificationStatus(notification);
                return notification;
            }

            // For low priority notifications, check if we should aggregate
            if (notification.priority === NotificationPriority.LOW) {
                const aggregatedNotification = await AggregationService.aggregateLowPriorityNotifications(notification.userId);
                if (aggregatedNotification) {
                    await Notification.create(aggregatedNotification);
                    await NotificationSearchService.storeNotification(aggregatedNotification);
                    return aggregatedNotification;
                }
            }

            notification.status = NotificationStatus.PROCESSING;
            await this.updateNotificationStatus(notification);
            return notification;
        } catch (error) {
            console.error('Error processing notification:', error);
            notification.status = NotificationStatus.FAILED;
            await this.updateNotificationStatus(notification);
            return notification;
        }
    }

    private static async processUrgentNotification(notification: IValidatedNotification): Promise<IValidatedNotification> {
        notification.status = NotificationStatus.PROCESSING;
        await this.updateNotificationStatus(notification);
        return notification;
    }

    private static async rescheduleNotification(notification: IValidatedNotification): Promise<IValidatedNotification> {
        const userPrefs = await UserPreferences.findOne({ userId: notification.userId });
        if (!userPrefs) {
            return notification;
        }

        const nextActiveTime = QuietHoursService.getNextActiveTime(
            userPrefs.quietHours.end,
            userPrefs.quietHours.timezone
        );

        notification.sendTime = nextActiveTime;
        notification.status = NotificationStatus.SCHEDULED;
        await this.updateNotificationStatus(notification);
        return notification;
    }

    private static async updateNotificationStatus(notification: IValidatedNotification): Promise<void> {
        await Notification.updateOne(
            { id: notification.id },
            { 
                $set: { 
                    status: notification.status,
                    sendTime: notification.sendTime 
                }
            }
        );
    }
}
