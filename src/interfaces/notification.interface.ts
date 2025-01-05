import { Types } from "mongoose";

export enum NotificationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SENT = "sent",
  FAILED = "failed",
  SCHEDULED = "scheduled",
  DELIVERED = "delivered",
  READ = "read",
  QUEUED = "queued",
  CANCELLED = "cancelled",
  AGGREGATED = "aggregated",
}

export enum NotificationType {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface INotification {
  _id?: string;
  userId: Types.ObjectId;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  retryCount: number;
  lastRetryAt?: Date;
  contentHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
  aggregatedInto?: string;
}

export interface INotificationCreate {
  userId: Types.ObjectId;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  scheduledFor?: Date;
}
