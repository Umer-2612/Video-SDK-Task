import { Schema, model } from "mongoose";
import { 
  INotification, 
  NotificationStatus, 
  NotificationType,
  NotificationPriority,
  NotificationCategory
} from "../interfaces/notification.interface";

const deliveryAttemptSchema = new Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      required: true,
    },
    error: String,
    provider: String,
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      required: true,
      default: NotificationPriority.MEDIUM,
      index: true,
    },
    templateId: {
      type: String,
      sparse: true,
    },
    templateData: {
      type: Schema.Types.Mixed,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      required: true,
      default: NotificationStatus.PENDING,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    deliveryAttempts: [deliveryAttemptSchema],
    scheduledFor: {
      type: Date,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    batchId: {
      type: String,
      sparse: true,
      index: true,
    },
    groupId: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for common queries
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, category: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ createdAt: 1 });

export const NotificationModel = model<INotification>("Notification", notificationSchema);
