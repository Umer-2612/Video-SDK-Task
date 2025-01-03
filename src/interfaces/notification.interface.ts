export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed'
}

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  SMS = 'sms'
}

export interface INotification {
  _id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
}

export interface INotificationCreate extends Omit<INotification, '_id' | 'status' | 'createdAt' | 'updatedAt' | 'sentAt'> {}
