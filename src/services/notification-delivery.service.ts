import { INotification, NotificationStatus, NotificationType } from "../interfaces/notification.interface";
import { NotificationModel } from "../models/notification.model";
import { logger } from "../utils/logger";

export class NotificationDeliveryService {
  private static instance: NotificationDeliveryService;
  private readonly maxRetries = 3;

  private constructor() {}

  public static getInstance(): NotificationDeliveryService {
    if (!NotificationDeliveryService.instance) {
      NotificationDeliveryService.instance = new NotificationDeliveryService();
    }
    return NotificationDeliveryService.instance;
  }

  public async deliverNotification(notification: INotification): Promise<boolean> {
    try {
      // Update status to processing
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.PROCESSING,
      });

      // Attempt delivery based on notification type
      const success = await this.sendToChannel(notification);

      if (success) {
        await this.markAsDelivered(notification);
        return true;
      } else {
        await this.handleDeliveryFailure(notification);
        return false;
      }
    } catch (error) {
      logger.error("Error delivering notification:", error);
      await this.handleDeliveryFailure(notification);
      return false;
    }
  }

  private async sendToChannel(notification: INotification): Promise<boolean> {
    switch (notification.type) {
      case NotificationType.EMAIL:
        return await this.sendEmail(notification);
      case NotificationType.SMS:
        return await this.sendSMS(notification);
      case NotificationType.PUSH:
        return await this.sendPushNotification(notification);
      default:
        logger.error(`Unsupported notification type: ${notification.type}`);
        return false;
    }
  }

  private async sendEmail(notification: INotification): Promise<boolean> {
    try {
      // Mock email sending
      logger.info("Sending email notification", {
        to: notification.userId,
        subject: notification.title
      });
      return true;
    } catch (error) {
      logger.error("Error sending email:", error);
      return false;
    }
  }

  private async sendSMS(notification: INotification): Promise<boolean> {
    try {
      // Mock SMS sending
      logger.info("Sending SMS notification", {
        to: notification.userId,
        message: notification.message
      });
      return true;
    } catch (error) {
      logger.error("Error sending SMS:", error);
      return false;
    }
  }

  private async sendPushNotification(notification: INotification): Promise<boolean> {
    try {
      // Mock push notification
      logger.info("Sending push notification", {
        to: notification.userId,
        title: notification.title,
        body: notification.message
      });
      return true;
    } catch (error) {
      logger.error("Error sending push notification:", error);
      return false;
    }
  }

  private async markAsDelivered(notification: INotification): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.DELIVERED,
      deliveredAt: new Date(),
      $push: {
        deliveryAttempts: {
          timestamp: new Date(),
          status: NotificationStatus.DELIVERED,
        },
      },
    });
  }

  private async handleDeliveryFailure(notification: INotification): Promise<void> {
    const attempts = notification.deliveryAttempts?.length || 0;

    if (attempts >= this.maxRetries) {
      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.FAILED,
        $push: {
          deliveryAttempts: {
            timestamp: new Date(),
            status: NotificationStatus.FAILED,
            error: "Max retry attempts reached",
          },
        },
      });
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = Math.pow(2, attempts) * 1000; // 2^n seconds
      const nextAttempt = new Date(Date.now() + retryDelay);

      await NotificationModel.findByIdAndUpdate(notification._id, {
        status: NotificationStatus.QUEUED,
        scheduledFor: nextAttempt,
        $push: {
          deliveryAttempts: {
            timestamp: new Date(),
            status: NotificationStatus.FAILED,
            error: "Delivery failed, scheduled for retry",
          },
        },
      });
    }
  }
}
