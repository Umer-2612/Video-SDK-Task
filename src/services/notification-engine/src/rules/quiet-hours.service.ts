import { UserPreferences } from '../models/user-preferences.model';
import { IValidatedNotification } from '../../../notification-ingestion/src/types/notification.types';
import moment from 'moment-timezone';

export class QuietHoursService {
    public static async isInQuietHours(notification: IValidatedNotification): Promise<boolean> {
        try {
            const userPrefs = await UserPreferences.findOne({ userId: notification.userId });
            if (!userPrefs || !userPrefs.quietHours) {
                return false;
            }

            const { start, end, timezone } = userPrefs.quietHours;
            const userTime = moment().tz(timezone);
            const currentTime = userTime.format('HH:mm');

            // Handle cases where quiet hours span across midnight
            if (start > end) {
                return currentTime >= start || currentTime < end;
            }

            return currentTime >= start && currentTime < end;
        } catch (error) {
            console.error('Error checking quiet hours:', error);
            return false; // Allow notifications on error
        }
    }

    public static getNextActiveTime(quietHoursEnd: string, timezone: string): Date {
        const userTime = moment().tz(timezone);
        const [hours, minutes] = quietHoursEnd.split(':');
        
        let nextActive = userTime.clone().set({
            hours: parseInt(hours),
            minutes: parseInt(minutes),
            seconds: 0,
            milliseconds: 0
        });

        if (nextActive.isBefore(userTime)) {
            nextActive.add(1, 'day');
        }

        return nextActive.toDate();
    }
}
