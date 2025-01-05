import {
  INotificationCreate,
  NotificationType,
  NotificationCategory,
} from "../interfaces/notification.interface";
import { UserModel } from "../models/user.model";
import { NotificationPreferenceModel } from "../models/notification-preference.model";
import { logger } from "../utils/logger";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class NotificationValidationService {
  private static instance: NotificationValidationService;

  private constructor() {}

  public static getInstance(): NotificationValidationService {
    if (!NotificationValidationService.instance) {
      NotificationValidationService.instance =
        new NotificationValidationService();
    }
    return NotificationValidationService.instance;
  }

  public async validateNotification(
    data: INotificationCreate
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Required fields validation
    if (!data.userId) errors.push("userId is required");
    if (!data.type) errors.push("type is required");
    if (!data.category) errors.push("category is required");
    if (!data.title) errors.push("title is required");
    if (!data.content) errors.push("content is required");
    if (!data.message) errors.push("message is required");

    // Return early if basic validation fails
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate enum values
    if (
      !Object.values(NotificationType).includes(data.type as NotificationType)
    ) {
      errors.push("Invalid notification type");
    }
    if (
      !Object.values(NotificationCategory).includes(
        data.category as NotificationCategory
      )
    ) {
      errors.push("Invalid notification category");
    }

    // Check if user exists
    const userExists = await this.validateUser(data.userId);
    if (!userExists) {
      errors.push("User not found");
    }

    // Check if notification type is enabled for user
    const channelEnabled = await this.validateChannel(data.type, data.userId);
    if (!channelEnabled) {
      errors.push(`${data.type} notifications are disabled for this user`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public async validateUser(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findOne({ _id: userId });
      return !!user;
    } catch (error) {
      logger.error("Error validating user:", error);
      return false;
    }
  }

  public async validateChannel(
    type: NotificationType,
    userId: string
  ): Promise<boolean> {
    try {
      const preferences = await NotificationPreferenceModel.findOne({ userId });
      if (!preferences) return true; // If no preferences set, assume all channels are enabled

      return !!preferences.channels[type]?.enabled;
    } catch (error) {
      logger.error("Error validating channel:", error);
      return false;
    }
  }
}
