import { Schema, model } from 'mongoose';
import { INotification, NotificationStatus, NotificationType } from '../interfaces/notification.interface';

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NotificationType),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, type: 1 });
notificationSchema.index({ createdAt: 1 });

export const NotificationModel = model<INotification>('Notification', notificationSchema);
