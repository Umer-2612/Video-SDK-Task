import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationStats extends Document {
    userId: string;
    hourlyCount: number;
    dailyCount: number;
    lastNotificationTime: Date;
    lastUpdated: Date;
}

const NotificationStatsSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hourlyCount: {
        type: Number,
        default: 0
    },
    dailyCount: {
        type: Number,
        default: 0
    },
    lastNotificationTime: {
        type: Date,
        required: true
    },
    lastUpdated: {
        type: Date,
        required: true
    }
});

// Reset counts if they're stale
NotificationStatsSchema.pre('save', function(next) {
    const stats = this as INotificationStats;
    const now = new Date();
    
    // Reset hourly count if more than an hour has passed
    if (now.getTime() - stats.lastUpdated.getTime() > 3600000) {
        stats.hourlyCount = 0;
    }
    
    // Reset daily count if more than a day has passed
    if (now.getTime() - stats.lastUpdated.getTime() > 86400000) {
        stats.dailyCount = 0;
    }
    
    stats.lastUpdated = now;
    next();
});

export const NotificationStats = mongoose.model<INotificationStats>('NotificationStats', NotificationStatsSchema);
