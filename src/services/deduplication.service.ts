import { NotificationModel } from "../models/notification.model";
import { INotification } from "../interfaces/notification.interface";
import { logger } from "../utils/logger";

export class DeduplicationService {
  private static instance: DeduplicationService;

  private constructor() {}

  public static getInstance(): DeduplicationService {
    if (!DeduplicationService.instance) {
      DeduplicationService.instance = new DeduplicationService();
    }
    return DeduplicationService.instance;
  }

  public async isDuplicate(notification: INotification): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Check for similar notifications in the last hour
      const duplicate = await NotificationModel.findOne({
        userId: notification.userId,
        type: notification.type,
        category: notification.category,
        content: notification.content,
        createdAt: { $gte: oneHourAgo },
        _id: { $ne: notification._id } // Exclude current notification
      });

      if (duplicate) {
        logger.info("Duplicate notification found", {
          originalId: duplicate._id,
          newId: notification._id,
          userId: notification.userId
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error("Error checking for duplicate notification:", error);
      return false; // In case of error, proceed with notification
    }
  }
}
