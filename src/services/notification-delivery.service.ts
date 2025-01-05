import { INotification, NotificationStatus, NotificationType } from "../interfaces/notification.interface";
import { NotificationModel } from "../models/notification.model";
import { logger } from "../utils/logger";

// Mock service configurations
const MOCK_EMAIL_SUCCESS_RATE = 0.95;  // 95% success rate
const MOCK_SMS_SUCCESS_RATE = 0.90;    // 90% success rate
const MOCK_PUSH_SUCCESS_RATE = 0.85;   // 85% success rate
const MOCK_DELAY_MS = 500;             // Simulate network delay

export class NotificationDeliveryService {
  private static instance: NotificationDeliveryService;
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // Exponential backoff

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
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

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
      logger.info(`[MOCK] Sending email to user ${notification.userId}`);
      const success = Math.random() < MOCK_EMAIL_SUCCESS_RATE;
      
      if (success) {
        logger.info(`[MOCK] Email sent successfully to user ${notification.userId}`);
      } else {
        throw new Error("Mock email service failure");
      }
      
      return success;
    } catch (error: unknown) {
      logger.error(`[MOCK] Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async sendSMS(notification: INotification): Promise<boolean> {
    try {
      logger.info(`[MOCK] Sending SMS to user ${notification.userId}`);
      const success = Math.random() < MOCK_SMS_SUCCESS_RATE;
      
      if (success) {
        logger.info(`[MOCK] SMS sent successfully to user ${notification.userId}`);
      } else {
        throw new Error("Mock SMS service failure");
      }
      
      return success;
    } catch (error: unknown) {
      logger.error(`[MOCK] SMS delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async sendPushNotification(notification: INotification): Promise<boolean> {
    try {
      logger.info(`[MOCK] Sending push notification to user ${notification.userId}`);
      const success = Math.random() < MOCK_PUSH_SUCCESS_RATE;
      
      if (success) {
        logger.info(`[MOCK] Push notification sent successfully to user ${notification.userId}`);
      } else {
        throw new Error("Mock push notification service failure");
      }
      
      return success;
    } catch (error: unknown) {
      logger.error(`[MOCK] Push notification delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async markAsDelivered(notification: INotification): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notification._id, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      retryCount: notification.retryCount,
      lastRetryAt: new Date(),
    });
  }

  private async handleDeliveryFailure(notification: INotification): Promise<void> {
    const retryCount = (notification.retryCount || 0) + 1;
    const status = retryCount >= this.maxRetries ? NotificationStatus.FAILED : NotificationStatus.PENDING;

    await NotificationModel.findByIdAndUpdate(notification._id, {
      status,
      retryCount,
      lastRetryAt: new Date(),
    });

    if (status === NotificationStatus.PENDING && retryCount < this.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = this.retryDelays[retryCount - 1] || this.retryDelays[this.retryDelays.length - 1];
      setTimeout(() => {
        this.deliverNotification(notification).catch(error => {
          logger.error("Retry delivery failed:", error);
        });
      }, delay);
    }
  }
}
