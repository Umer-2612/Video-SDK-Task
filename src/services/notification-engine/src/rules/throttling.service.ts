import { UserPreferences } from "../models/user-preferences.model";
import { NotificationStats } from "../models/notification-stats.model";
import { IValidatedNotification } from "../../../notification-ingestion/src/types/notification.types";

export class ThrottlingService {
  public static async checkThrottling(
    notification: IValidatedNotification
  ): Promise<boolean> {
    try {
      const userPrefs = await UserPreferences.findOne({
        userId: notification.userId,
      });
      if (!userPrefs) {
        return true; // Allow if no preferences set
      }

      const stats = await this.getOrCreateStats(notification.userId);

      return (
        stats.hourlyCount < userPrefs.notificationLimits.hourlyLimit &&
        stats.dailyCount < userPrefs.notificationLimits.dailyLimit
      );
    } catch (error) {
      console.error("Error checking throttling:", error);
      return true; // Allow on error
    }
  }

  private static async getOrCreateStats(userId: string): Promise<any> {
    const now = new Date();
    const stats = await NotificationStats.findOneAndUpdate(
      { userId },
      {
        $inc: {
          hourlyCount: 1,
          dailyCount: 1,
        },
        $set: {
          lastNotificationTime: now,
          lastUpdated: now,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return stats;
  }

  public static async resetStats(userId: string): Promise<void> {
    await NotificationStats.updateOne(
      { userId },
      {
        $set: {
          hourlyCount: 0,
          dailyCount: 0,
          lastUpdated: new Date(),
        },
      }
    );
  }
}
