import mongoose, { Document, Schema } from 'mongoose';
import { NotificationChannel } from '../../../notification-ingestion/src/types/notification.types';

export interface IUserPreferences extends Document {
    userId: string;
    channels: NotificationChannel[];
    quietHours: {
        start: string; // HH:mm format
        end: string;   // HH:mm format
        timezone: string;
    };
    notificationLimits: {
        hourlyLimit: number;
        dailyLimit: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserPreferencesSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    channels: [{
        type: String,
        enum: Object.values(NotificationChannel),
        default: [NotificationChannel.EMAIL]
    }],
    quietHours: {
        start: {
            type: String,
            default: "22:00"
        },
        end: {
            type: String,
            default: "08:00"
        },
        timezone: {
            type: String,
            default: "UTC"
        }
    },
    notificationLimits: {
        hourlyLimit: {
            type: Number,
            default: 3
        },
        dailyLimit: {
            type: Number,
            default: 50
        }
    }
}, {
    timestamps: true
});

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
