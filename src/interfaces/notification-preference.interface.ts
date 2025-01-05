export interface IChannelPreference {
  enabled: boolean;
  quietHours?: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  limits?: {
    hourly: number;
    daily: number;
  };
}

export interface INotificationPreference {
  userId: string;
  channels: {
    email: IChannelPreference;
    sms: IChannelPreference;
    push: IChannelPreference;
  };
  globalQuietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  globalLimits?: {
    hourly: number;
    daily: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
