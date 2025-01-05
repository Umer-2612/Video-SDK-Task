import { Schema, model } from "mongoose";
import {
  INotification,
  NotificationStatus,
  NotificationPriority,
  NotificationType,
} from "../interfaces/notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      required: true,
      default: NotificationPriority.LOW,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      required: true,
      default: NotificationStatus.PENDING,
      index: true,
    },
    scheduledFor: {
      type: Date,
      index: true,
    },
    sentAt: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: Date,
    // For deduplication
    contentHash: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for throttling queries (userId + createdAt)
notificationSchema.index({ userId: 1, createdAt: -1 });

// Index for deduplication (userId + contentHash + createdAt)
notificationSchema.index({ userId: 1, contentHash: 1, createdAt: -1 });

export const NotificationModel = model<INotification>(
  "Notification",
  notificationSchema
);
