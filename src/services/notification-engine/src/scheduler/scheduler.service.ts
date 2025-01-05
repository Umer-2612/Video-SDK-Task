import { Notification } from '../models/notification.model';
import { NotificationStatus } from '../../../notification-ingestion/src/types/notification.types';
import { NotificationProcessor } from '../processors/notification.processor';

export class SchedulerService {
    private static readonly CHECK_INTERVAL = 60000; // 1 minute
    private static interval: NodeJS.Timeout;

    public static start(): void {
        this.interval = setInterval(this.checkPendingNotifications.bind(this), this.CHECK_INTERVAL);
        console.log('✅ Notification scheduler started');
    }

    public static stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('Notification scheduler stopped');
        }
    }

    private static async checkPendingNotifications(): Promise<void> {
        try {
            const now = new Date();
            const pendingNotifications = await Notification.find({
                status: NotificationStatus.SCHEDULED,
                sendTime: { $lte: now }
            }).sort({ sendTime: 1 }).limit(100);

            for (const notification of pendingNotifications) {
                try {
                    await NotificationProcessor.processNotification(notification);
                } catch (error) {
                    console.error(`Error processing scheduled notification ${notification.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error checking pending notifications:', error);
        }
    }
}
