export interface INotificationRequest {
    userId: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    sendTime?: Date;
    metadata?: Record<string, any>;
    channels?: NotificationChannel[];
}

export enum NotificationType {
    ALERT = 'ALERT',
    INFO = 'INFO',
    REMINDER = 'REMINDER',
    MARKETING = 'MARKETING'
}

export enum NotificationPriority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW'
}

export enum NotificationChannel {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH'
}

export interface IValidatedNotification extends INotificationRequest {
    id: string;
    createdAt: Date;
    status: NotificationStatus;
}

export enum NotificationStatus {
    PENDING = 'PENDING',
    SCHEDULED = 'SCHEDULED',
    PROCESSING = 'PROCESSING',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED'
}
