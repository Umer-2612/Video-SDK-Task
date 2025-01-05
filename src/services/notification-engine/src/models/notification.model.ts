import mongoose, { Document, Schema } from 'mongoose';
import { NotificationStatus, NotificationType, NotificationPriority, NotificationChannel } from '../../../notification-ingestion/src/types/notification.types';

export interface INotification extends Document {
    id: string;
    userId: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    status: NotificationStatus;
    sendTime?: Date;
    metadata?: Record<string, any>;
    channels?: NotificationChannel[];
    createdAt: Date;
    updatedAt: Date;
    retryCount?: number;
    lastRetryAt?: Date;
}

const NotificationSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(NotificationType),
        required: true
    },
    priority: {
        type: String,
        enum: Object.values(NotificationPriority),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(NotificationStatus),
        required: true,
        index: true
    },
    sendTime: {
        type: Date,
        index: true
    },
    metadata: {
        type: Schema.Types.Mixed
    },
    channels: [{
        type: String,
        enum: Object.values(NotificationChannel)
    }],
    retryCount: {
        type: Number,
        default: 0
    },
    lastRetryAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ sendTime: 1, status: 1 });
NotificationSchema.index({ createdAt: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
