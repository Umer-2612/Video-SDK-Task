export enum NotificationStatus {
  PENDING = "pending",
  QUEUED = "queued",
  PROCESSING = "processing",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SCHEDULED = "scheduled",
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

export enum NotificationCategory {
  MARKETING = "marketing",
  SYSTEM = "system",
  SECURITY = "security",
}

export interface INotificationTemplate {
  name: string;
  category: NotificationCategory;
  title: string;
  content: string;
  variables: string[];
}

export interface INotificationDeliveryAttempt {
  timestamp: Date;
  status: NotificationStatus;
  error?: string;
  provider?: string;
  metadata?: Record<string, any>;
}

export interface INotification {
  _id?: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  templateId?: string;
  templateData?: Record<string, any>;
  title: string;
  content: string;
  message: string;
  status: NotificationStatus;
  scheduledTime?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  deliveryAttempts: INotificationDeliveryAttempt[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  batchId?: string;
  groupId?: string;
  save(): Promise<INotification>;
}

export interface INotificationCreate
  extends Omit<
    INotification,
    | "_id"
    | "status"
    | "deliveryAttempts"
    | "createdAt"
    | "updatedAt"
    | "sentAt"
    | "deliveredAt"
    | "readAt"
  > {}
