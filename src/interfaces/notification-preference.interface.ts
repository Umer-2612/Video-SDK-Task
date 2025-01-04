export interface INotificationChannel {
  enabled: boolean;
  config?: {
    email?: string;
    phoneNumber?: string;
    deviceTokens?: string[];
    webhookUrl?: string;
  };
}

export interface INotificationPreference {
  _id?: string;
  userId: string;
  channels: {
    email: INotificationChannel;
    push: INotificationChannel;
    sms: INotificationChannel;
    webhook?: INotificationChannel;
  };
  categories: {
    marketing: boolean;
    system: boolean;
    security: boolean;
    [key: string]: boolean;
  };
  schedules?: {
    quietHours?: {
      start: string; // HH:mm format
      end: string;
      timezone: string;
    };
    deliveryWindow?: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
